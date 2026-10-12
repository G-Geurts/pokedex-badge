env			?= dev
region		?= eu-west-1
logLevel	?= INFO

pkg-name		= $(shell npm run get-name -s)
pkg-version		= $(shell npm run get-version -s)
# Une stack éphémère par PR (prId fourni par la CI) ; sinon une stack par environnement.
stackNameSuffix	?= $(if $(prId),pr-$(prId),$(env))
stackName		?= $(pkg-name)-$(stackNameSuffix)

# Environment stack outputs
domainName				?= gge.germen-collectif.fr
apiGatewayAccessLogFormat=$(shell aws ssm get-parameter --region $(region) --name "/garance-deploy-params/ApiGatewayAccessLogsFormat" --query "Parameter.Value" --output text)

allowedHeaders			?= Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key
allowedOrigins			?= *
apiDomainName			?=
apiName					?= PokedexGauvainLevel API
apiPathName				?= pokedex-gauvain-level
apiStageName			?= v1
minifyingEnabled		?= true
# Les données d'une stack de PR sont jetables ; partout ailleurs la table survit à la stack.
dataDeletionPolicy		?= $(if $(prId),Delete,Retain)

ifeq ($(env), dev)
allowedOrigins=*
logLevel=DEBUG
minifyingEnabled=false
else ifeq ($(env), test)
allowedOrigins=*
endif

# Plomberie commune (outputs de stacks, layer, cfn-lint…) versionnée dans @garance-retraite/domain-tooling.
# Domaine qui lit l'OpenSearch mutualisé : ajouter `include $(toolingMk)/opensearch.mk`.
toolingMk := node_modules/@garance-retraite/domain-tooling/mk
include $(toolingMk)/plumbing.mk

# sam build (esbuild) utilise l'esbuild du projet, à la version du lockfile.
export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

# Premier `make` sur un clone neuf : installe les dépendances pour obtenir les .mk inclus.
$(toolingMk)/%.mk:
	@npm ci || { echo "npm ci a échoué : vérifier package-lock.json et le token GitHub Packages de ~/.npmrc (CONTRIBUTING.md § Setup local)"; exit 1; }

.PHONY: build

# Le layer doit exister avant `sam build`, qui empaquette ContentUri: ../dist/layer.
build: node_modules build-DependenciesLayer
	@sam build \
		--template-file sam/template.yml --manifest package.json \
		--parameter-overrides \
			MinifyingEnabled='$(minifyingEnabled)'

.PHONY: all autodeploy deploy

all: clean build deploy

autodeploy: clean build deploy

# CORS : `*` toléré en dev et test uniquement ; en uat/prod, lister les origines du front
# (ex. `ifeq ($(env), prod)` + `allowedOrigins=https://app.example.fr`, plusieurs séparées par des virgules).
.PHONY: check-allowed-origins
check-allowed-origins:
	@if [ "$(allowedOrigins)" = "*" ] && [ -n "$(filter $(env),uat prod)" ]; then \
		echo "allowedOrigins=* interdit en $(env) : définir les origines autorisées dans le Makefile."; exit 1; \
	fi

deploy: check-allowed-origins $(initStackName).outputs build
	sam deploy \
		--region $(region) \
		--template-file .aws-sam/build/template.yaml \
		--no-fail-on-empty-changeset \
		--s3-prefix $(pkg-name)/$(prId) \
		--s3-bucket $(templateBucket) \
		--stack-name $(stackName) \
		--capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
		--role-arn $(cloudformationRole) \
		--tags \
			garance:cloudformation:stack-name=$(stackName) \
			garance:git:commit=$(gitCommit) \
			garance:git:version=$(gitVersion) \
			garance:git:source=$(gitRepoName) \
			map-migrated=$(mapTag) \
		--parameter-overrides \
			AllowedHeaders='$(allowedHeaders)' \
			AllowedOrigins='$(allowedOrigins)' \
			ApiGatewayAccessLogFormat='$(apiGatewayAccessLogFormat)' \
			$(if $(apiDomainName),ApiGatewayDomainName='$(apiDomainName)') \
			DataDeletionPolicy='$(dataDeletionPolicy)' \
			LoggerLevel='$(logLevel)' \
			MinifyingEnabled='$(minifyingEnabled)' \
			ApiName='$(apiName)' \
			ApiPathName=$(apiPathName) \
			ApiStageName=$(apiStageName)
	@rm -f $(stackName).outputs
	@$(MAKE) --no-print-directory $(stackName).outputs

.PHONY: test-e2e test-benchmark

# E2E / benchmark contre la stack déployée (env=… [prId=…]) : le nom de stack et le
# .outputs viennent du Makefile, rien à recopier à la main.
test-e2e test-benchmark: $(stackName).outputs
	env=$(env) stackName=$(stackName) apiStageName=$(apiStageName) AWS_REGION=$(region) npm run $(subst test-,test:,$@)

.PHONY: clean-stack clean

clean-stack: $(stackName).outputs
	aws cloudformation delete-stack \
		--region $(region) \
		--stack-name $(stackName)

	aws cloudformation wait stack-delete-complete \
		--region $(region) \
		--stack-name $(stackName)

clean:
	-@rm -f *.outputs
	-@rm -rf node_modules
	-@rm -rf dist
	-@rm -rf .aws-sam/build

devBucketName?=$(shell grep -w 'DevBucketName' $(edmSwagger).outputs | cut -f2)
swagger-generator: ~/.npmrc $(edmSwagger).outputs
	@npm i --no-save --no-package-lock --no-audit @garance-retraite/swagger-generator@latest
	ENV=$(env) VERSION=$(RELEASE_VERSION) API_NAME="$(apiName)" URL=https://$(domainName)/$(apiStageName) FILENAME=pokedex-gauvain npx --no-install swagger-generator

swagger-sync:
	@ENV=$(env) DOMAIN=$(pkg-name) S3=$(devBucketName) npx --no-install swagger-sync.sh

sourceInspectorPackage=@garance-retraite/source-inspector@latest
gitHash:=$(shell git rev-parse HEAD)
artifactBucket?=$(shell aws ssm get-parameter --name "/garance-library-source-inspector/artifact-bucket" --query "Parameter.Value" --output text)
inspect-source: ~/.npmrc
	@npm i --no-save --no-package-lock --no-audit $(sourceInspectorPackage)
	GITHUB_SHA=$(gitHash) npx --no-install inspect-source --s3-bucket $(artifactBucket) --reporter auto check . --success-on-fail

inspect-source-sync: ~/.npmrc
	@npm i --no-save --no-package-lock --no-audit $(sourceInspectorPackage)
	GITHUB_SHA=$(gitHash) npx --no-install inspect-source --s3-bucket $(artifactBucket) --reporter auto sync . --success-on-fail
