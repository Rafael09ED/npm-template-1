import { InstallationPlan, DependencyInstallation } from "../../types";
import { getPackageInfo } from "../../util/registry";
import * as semver from 'semver';


/**
 *
 * @param topLevelDependencies The list of dependencies as determined by package.json's `dependencies` object
 * @returns The installation plan
 */
export async function constructInstallationPlan(
  topLevelDependencies: Record<string, string>
): Promise<InstallationPlan> {

  const installationPlan: InstallationPlan = [];
  for (const [name, version] of Object.entries(topLevelDependencies)) {
    // for ranges in the installation plan, is it possible to switch to a lower version that will produce more overlaps? May be too many permutations
    installationPlan.push({ name, version });
  }

  const allDependencies = new Map<string, {
    requiredBy: string;
    versionRequested: string;
  }[]>();

  const getDependencies = async (name: string, version: string) => {
    const packageInfo = await getPackageInfo({ name, version });
    // console.log(packageInfo);
    if (!packageInfo.dependencies) return; // No dependencies from API
    //TODO: map & use Promise.all to parallelize the dependency resolution
    for (const [childName, childVersion] of Object.entries(packageInfo.dependencies)) {


      // Initialize entry if new dependency
      if (!allDependencies.has(childName)) allDependencies.set(childName, []);

      // handle invalid semver ranges
      if (!semver.validRange(childVersion)) {
        console.error(`Invalid semver range for ${childName}: ${childVersion}`);
        continue;
      }

      // handle circular dependencies by checking if the same dependency and version is already in the map
      if (allDependencies.get(childName)?.some(dep => dep.requiredBy === name && dep.versionRequested === version)) continue;

      allDependencies.get(childName)?.push({ requiredBy: name, versionRequested: childVersion });
      await getDependencies(childName, childVersion);
    }
  }

  for (const [name, version] of Object.entries(topLevelDependencies)) {
    await getDependencies(name, version);
  }


  //TODO: handle semver ranges that don't overlap

  // Process dependencies with conflicting versions
  // Sweep Line Algorithm
  for (const [packageName, requiredBy] of allDependencies.entries()) {
    // Skip if already planned by top level dependencies
    if (installationPlan.some(dep => dep.name === packageName && requiredBy.find(req => req.requiredBy === dep.name))) {
      continue;
    }

    // Find a version that satisfies the most requirements by counting overlaps
    let bestVersion = null;
    let maxSatisfiedCount = 0;
    //TODO: track the overlap ange so we can install it instead of the range of the 

    // Try each requirement's version as a candidate
    //TODO: handle versions with *
    for (const candidate of requiredBy.sort((a, b) => semver.compare(a.versionRequested, b.versionRequested))) {
      let satisfiedCount = 0;

      // Check how many other requirements this version satisfies
      for (const req of requiredBy) {
        if (semver.satisfies(candidate.versionRequested, req.versionRequested)) satisfiedCount++;
      }

      if (satisfiedCount > maxSatisfiedCount) {
        maxSatisfiedCount = satisfiedCount;
        bestVersion = candidate.versionRequested;
      }
    }

    // Add the best version to the installation plan
    if (bestVersion) {
      installationPlan.push({
        name: packageName,
        version: bestVersion
      });

      if (maxSatisfiedCount < requiredBy.length) {
        console.warn(`Version conflict for ${packageName}: Using ${bestVersion} (satisfies ${maxSatisfiedCount}/${requiredBy.length} requirements)`);
      }
    }

    requiredBy
      .filter((v) => bestVersion ? !semver.satisfies(v.versionRequested, bestVersion) : true)
      .forEach((v) => {
        installationPlan.push({
          name: packageName,
          version: v.versionRequested,
          //TODO: what is the scenario where we need to do nested dependencies of dependencies?
          parentDirectory: v.requiredBy,
        });
      });
  }

  console.log(installationPlan);
  return installationPlan;
}

// Stopped at ~90 mintues