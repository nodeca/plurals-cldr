NPM_PACKAGE := $(shell node -e 'console.log(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'console.log(require("./package.json").version)')

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_PROJ := nodeca/${NPM_PACKAGE}


lint:
	./node_modules/.bin/eslint --reset ./


test: lint
	./node_modules/.bin/mocha


coverage:
	rm -rf coverage
	./node_modules/.bin/istanbul cover node_modules/.bin/_mocha


test-ci: lint
	./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage


clean:
	rm -rf ./node_modules/cldr-data
	npm install


generate:
	./support/generate.js
	make test
	make browserify
	@echo "GENERATION COMPLETE!"


browserify:
	rm -rf ./dist
	mkdir dist
	# Browserify
	( printf "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		./node_modules/.bin/browserify -r ./ -s "plurals-cldr" \
		) > dist/plurals-cldr.js
	# Minify
	./node_modules/.bin/uglifyjs dist/plurals-cldr.js -c -m \
		--preamble "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" \
		> dist/plurals-cldr.min.js


publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}


.PHONY: lint test todo generate browserify coverage
.SILENT: lint test todo
