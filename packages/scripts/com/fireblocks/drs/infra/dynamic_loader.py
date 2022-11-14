import faulthandler
import pkgutil
import sys
from os.path import isfile

dependency_map = {}

MODULE_NAME = 'name'
MODULE_CHILDREN = 'children'
MODULE = 'module'
BASE_DEP_PATH = 'res/dependencies/'

DEBUG = False


def get_dep(name: str):
    """
    Gets a dependency based off the name of the dependency.
    The name is either the top-level or a child modules.

    This should replace the import statement for non system modules, so any dependency that requires an installation.
    So instead of running:

    `import Crypto`

    Where Crypto is some dependency, you would run:

    `Crypto = get_dep("Crypto")`

    And instead of running:

    `from Crypto import Random`

    Where Random is sub-module of Crypto (a folder within the folder of Crypto), you'd run:

    `Random = get_dep("Crypto.Random")`

    :param name: the name of the dependency.
    :return: the module if exists, throws an error if no such module exists.
    """
    if len(dependency_map.keys()) == 0:
        _load_all_deps()

    dep_path = name.split('.')

    if dep_path[0] not in dependency_map.keys():
        raise ImportError(f"Requested dependency {dep_path[0]} is not part of the loaded dependency map")

    parent_dep = dependency_map[dep_path[0]]
    if len(dep_path) > 1:
        if MODULE_CHILDREN not in parent_dep or len(parent_dep[MODULE_CHILDREN]) == 0:
            raise ImportError(f"Dependency: {dep_path[0]} does not have any child modules.")
        child_deps = parent_dep[MODULE_CHILDREN]

        for child in child_deps:
            if child[MODULE_NAME] == dep_path[1]:
                return child[MODULE]

        raise ImportError(f"Child dependency {dep_path[1]} for parent {dep_path[0]} does not exist.")
    else:
        return parent_dep[MODULE]


def _load_all_deps(level: int = 0, failed_sub_modules=[]):
    """
    Loads all dependencies from the deps folder under resources.
    The dependencies are loaded in several stages:

    - Top level modules are loaded, these divide into two options:

        - Module can act as a standalone, this means that they are able to work without any further dependencies. Most needed content is part of the already existing python environment (depends on base system modules).
        - Module can't act as a standalone, this means that they have some dependencies. These are not loaded at this point in time, but will be loaded later, once all their dependencies are loaded.

    - For each top level module we explore the directory and for each sub folder we check if it is exposed as part of the module itself:

        - If it is, we continue to the next subfolder (we assume that all subfolders within our current subfolder are also exposed, in case of this being incorrect the behavior needs to be fixed).
        - If it is not, we load the module as a child module for the parent.

    - Once all top modules and child modules were loaded, we repeat all the loading again, this time we do not perform the sub folder exploration. This is meant to try and load again all the modules that are not standalones and failed before.

    :param level: the recursion level, this is meant just for the last item on the above list.
    :return: nothing.
    """

    if level == 0:
        print("Loading all dependencies...")

    for importer, package_name, _ in pkgutil.iter_modules([BASE_DEP_PATH]):
        if package_name not in sys.modules:

            if "test" in package_name or "Test" in package_name or "TEST" in package_name:
                log(f"[INFO] Skipping {package_name} because suspected test.")
                continue
            try:
                module = importer.find_module(package_name).load_module(package_name)
            except Exception as e:
                log(f"[ERROR] Failed to load {package_name} - will try again later - {e}")
                continue
            sys.modules[package_name] = module
            sub_modules = []
            try:
                sub_modules = _load_sub_modules(f"{BASE_DEP_PATH}{package_name}", module)
            except:
                failed_sub_modules.append(package_name)
            dependency_map[package_name] = {MODULE: module, MODULE_CHILDREN: sub_modules}
        else:
            # Since we set the system modules to include our imported modules, we need to make sure
            # that we do not override them (since children data will be deleted). This is only relevant for the
            # second iteration of the dependency load.
            # The only condition to try and load the module again is only to try and update the sub modules.
            # This is relevant in case the usb module tries to load a package that will be loaded later on.
            if level > 0 and package_name in dependency_map.keys() and package_name not in failed_sub_modules:
                continue

            if package_name in failed_sub_modules:
                try:
                    log(f"[INFO] Trying to reload child modules for {package_name}")
                    sub_modules = _load_sub_modules(f"{BASE_DEP_PATH}{package_name}",
                                                    dependency_map[package_name][MODULE])
                    dependency_map[package_name][MODULE_CHILDREN] = sub_modules
                    failed_sub_modules.remove(package_name)
                    continue
                except Exception as e:
                    log(f"[ERROR] Failed to load sub modules in second iteration due to: {e}")
                    continue

            dependency_map[package_name] = {MODULE: sys.modules[package_name], MODULE_CHILDREN: []}

    if level != 5:
        _load_all_deps(level + 1, failed_sub_modules)


def _load_sub_modules(path: str, module: any):
    """
    Loads all sub modules from a given directory.
    Assume the following directory structure:

    module
    ⎿ sub_module_a
        ⎿ __init__.py
        ⎿ code.py
        ⎿ ...
    ⎿ __init__.py

    If sub_moudle_a is included in the exported data for module, then we are okay, however if it is not, we need
    to provide a way to access this sub module manually. This is done by loading this sub_module_a as well.

    :param path: the path of the module we're examining.
    :param module: the parent module.
    """
    child_modules = []
    for importer, package_name, _ in pkgutil.iter_modules([path]):
        if "test" in package_name or "Test" in package_name or "TEST" in package_name:
            log(f"[INFO] Skipping {path}/{package_name} because suspected test.")
            continue

        if "__main__" in package_name:
            log(f"[INFO] Skipping: {path}/{package_name} - main file, not module.")
            continue

        try:
            attr = getattr(module, package_name)
            if attr is None:
                if isfile(f"{path}/{package_name}/__init__.py"):
                    add_child = True
                else:
                    log(f"[INFO] Folder {path}/{package_name} doesn't have __init__.py")
                    continue
            else:
                child_modules.append({MODULE_NAME: package_name, MODULE: attr})
                continue
        except:  # Attribute child module doesn't exist, need to import it.
            add_child = True

        if add_child:
            try:
                log(f"[INFO] Trying to load: {path}/{package_name}")
                child = importer.find_module(package_name).load_module(package_name)
                child_modules.append({MODULE_NAME: package_name, MODULE: child})
            except Exception as e:
                try:
                    child = importer.find_module(package_name).load_module(f"{path.replace('/','.')}.{package_name}")
                    child_modules.append({MODULE_NAME: package_name, MODULE: child})
                except Exception as e1:
                    log(f"[ERROR] Failed to load child {package_name} - {e}.")
                    raise e
                log(f"[ERROR] Failed to load child {package_name} - {e}.")
                raise e

    return child_modules


def log(msg):
    if DEBUG:
        print(msg)
