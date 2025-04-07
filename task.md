# Continue take-home exercise

tl;dr: finish [this function](https://github.com/continuedev/npm-template/blob/main/src/commands/install/TODO.ts#L11-L12)

## Intro

- This exercise should take roughly 90 minutes. If you find yourself going too much over, please let us know—we want to be respectful of your time.
- The goal is to build a minimal package manager for NodeJS (deep prior knowledge of package managers isn't necessary!)
- You should write your code in TypeScript. Start by selecting "Use this template" in our [starter repository](https://github.com/continuedev/npm-template).
- You may leverage third-party dependencies, the internet, or any other resources you’d like (we encourage you to use Continue!)
- Once you are done, please share your code with whomever you met with on the Continue team ([patrick/dallin/tomasz]@continue.dev) as well as [nate@continue.dev](mailto:nate@continue.dev) in a private GitHub repository

## Background

NodeJS lets you use packages built by others by including them in a folder called “node_modules”. But how the packages arrive in that folder is a question left to package managers.

The original Node Package Manager (NPM) is commonly used, but has a number of alternatives, including Yarn, PNPM, and Bun’s package manager. Each of them makes it easy to add new packages to your project and keep track of them.

Since NPM was built first, their “registry” (the hosting server where people publish packages and download them from for use) is used in almost all cases. You can search through packages on the registry by going to https://npmjs.com.

Let’s say you’re installing [`is-thirteen`](https://www.npmjs.com/package/is-thirteen), a useful package that tells you whether a number is equal to thirteen. When you type `npm install is-thirteen`, the NPM program will interact with the [registry’s API](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md) to gather information on the package, it’s dependencies, and the data that should be downloaded into node_modules. This same API is the one that will be used by your package manager.

Package managers have many commands, but we want you to focus only on "install". By the end of the exercise, your package manager should be able to:

1. `add <package_name>` (already completed in the starter code) - Adds the dependency to the “dependencies” object in package.json
    - This will take a single argument, which is the name of the package
    - The package might include a version, delimited by “@” like “is-thirteen@0.1.13”, which it should parse
    - It should write to an *existing* (you can create it manually or with `npm init`) package.json to add `"is-thirteen": "0.1.13"` to the `dependencies` object

2. `install` - Downloads all of the packages that are specified in package.json, and their entire tree of dependencies
    - Assume a fresh install (the node_modules folder is empty)
    - Read the `dependencies` object of package.json
    - Determine the full list of dependencies to install, and where to install them **`<-- this is the task`**
    - Download each to the appropriate place in the node_modules folder

## Task

Most of the boilerplate code has been written for you, so your main job is to [determine the list of dependencies to install](https://github.com/continuedev/npm-template/blob/main/src/commands/install/TODO.ts#L11-L12). While we don't expect a perfect implementation to be possible in 90 minutes, you should try to solve one of the below problems, or another that you deem more important:

#### Nested dependencies
When two or more dependencies require different versions of another dependency, `npm` by default uses a nested dependency strategy. For example, if package-A and package-B depend respectively on versions 1.0.0 and 2.0.0 of shared-dep, then the `node_modules` folder will be structured as follows, allowing NodeJS to import the proper version in each case (imports are resolved from the closest node_modules folder first):

```
node_modules/
├── package-A/
│   ├── node_modules/
│   │   └── shared-dep (version 1.0.0)
│   └── ...
├── package-B/
│   ├── node_modules/
│   │   └── shared-dep (version 2.0.0)
│   └── ...
└── ...
```

#### Minimizing downloads
NPM uses [semantic versioning](https://www.npmjs.com/package/semver) so that packages may permit a range of versions for each of their dependencies. If multiple different packages require the same dependency, but with different range requirements, we must satisfy all of them. Once you determine the list of requirements for a given shared dependency, can you determine the version that satisfies the largest number of them? This version should probably be placed at the root level of node_modules.

#### Reproducible installs
If a new version of a package is published to the NPM registry, this might change the exact node_modules tree that gets installed in your project. Can you record enough information in a file (like [package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)) and use this file to ensure that installs are reproducible?

#### Caching
It’s a waste of storage and time to be redownloading a package that you’ve already downloaded for another project. How can you save something globally to avoid extra downloads?

## End

For fun and not at all necessary to share: Once you’re done, try running your code using your own package manager! Use your `add` command to add all of the dependencies to output/package.json, run your `install` command to download everything to output/node_modules, and then copy output/node_modules to node_modules.