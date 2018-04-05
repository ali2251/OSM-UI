function isRelativePath(path) {
    if (path.split('/')[0] == '..') {
        return true;
    }
    return false;
}

function getResults(topLevelObject, pathArray) {
    let objectCopy = _cloneDeep(topLevelObject);
    let i = pathArray.length;
    let results = [];

    while (pathArray[pathArray.length - i]) {
        if (_isArray(objectCopy[pathArray[pathArray.length - i]])) {
            if (i == 2) {
                results = _map(objectCopy[pathArray[pathArray.length - i]], pathArray[pathArray.length - 1]);
            } else {
                objectCopy = objectCopy[pathArray[pathArray.length - i]];
            }
        } else if (_isArray(objectCopy)) {
            objectCopy.map((object) => {
                if (_isArray(object[pathArray[pathArray.length - i]])) {
                    if (i == 2) {
                        results = results.concat(_map(object[pathArray[pathArray.length - i]], pathArray[pathArray.length - 1]));
                    }
                }
            })
        }
        i--;
    }

    return results;
}

function getAbsoluteResults(topLevelObject, pathArray) {
    let i = pathArray.length;
    let objectCopy = _cloneDeep(topLevelObject);
    let results = [];

    let fragment = pathArray[pathArray.length - i]

    while (fragment) {
        if (i == 1) {
            // last fragment
            if (_isArray(objectCopy)) {
                // results will be obtained from a map
                results = _map(objectCopy, fragment);
            } else {
                // object
                if (fragment.match(/\[.*\]/g)) {
                    // contains a predicate
                    // shouldn't reach here
                    console.log('Something went wrong while resolving a leafref. Reached a leaf with predicate.');
                } else {
                    // contains no predicate
                    if (!objectCopy) {
                        break;
                    }
                    results.push(objectCopy[fragment]);
                }
            }
        } else {
            if (_isArray(objectCopy)) {
                // is array
                objectCopy = _map(objectCopy, fragment);

                // If any of the deeper object is an array, flatten the entire list.
                // This would usually be a bad leafref going out of its scope.
                // Log it too
                for (let i = 0; i < objectCopy.length; i++) {
                    if (_isArray(objectCopy[i])) {
                        objectCopy = _flatten(objectCopy);
                        console.log('This might be a bad leafref. Verify with backend team.')
                        break;
                    }
                }
            } else {
                // is object
                if (fragment.match(/\[.*\]/g)) {
                    // contains a predicate
                    let predicateStr = fragment.match(/\[.*\]/g)[0];
                    // Clip leading [ and trailing ]
                    predicateStr = predicateStr.substr(1, predicateStr.length - 2);
                    const predicateKeyValue = predicateStr.split('=');
                    const predicateKey = predicateKeyValue[0];
                    const predicateValue = predicateKeyValue[1];
                    // get key for object to search into
                    let key = fragment.split('[')[0];
                    let searchObject = {};
                    searchObject[predicateKey] = predicateValue;
                    let found = _find(objectCopy[key], searchObject);
                    if (found) {
                        objectCopy = found;
                    } else {
                        // check for numerical value
                        if (predicateValue != "" &&
                            predicateValue != null &&
                            predicateValue != NaN &&
                            predicateValue != Infinity &&
                            predicateValue != -Infinity) {
                            let numericalPredicateValue = _toNumber(predicateValue);
                            if (_isNumber(numericalPredicateValue)) {
                                searchObject[predicateKey] = numericalPredicateValue;
                                found = _find(objectCopy[key], searchObject);
                            }
                        }
                        if (found) {
                            objectCopy = found;
                        } else {
                            return [];
                        }
                    }
                } else {
                    // contains no predicate
                    if (!objectCopy) {
                        break;
                    }
                    objectCopy = objectCopy[fragment];
                    if (!objectCopy) {
                        // contains no value
                        break;
                    }
                }
            }
        }
        i--;
        fragment = pathArray[pathArray.length - i];
    }

    return results;
}

function resolveCurrentPredicate(leafRefPath, container, pathCopy) {
    if (leafRefPath.indexOf('current()') != -1) {
        // contains current

        // Get the relative path from current
        let relativePath = leafRefPath.match("current\\(\\)\/(.*)\]");
        let relativePathArray = relativePath[1].split('/');

        while (relativePathArray[0] == '..') {
            pathCopy.pop();
            relativePathArray.shift();
        }

        // Supports only one relative path up
        // To support deeper paths, will need to massage the string more
        // i.e. change '/'' to '.'
        const searchPath = pathCopy.join('.').concat('.', relativePathArray[0]);
        const searchValue = resolvePath(container.model, searchPath);

        const predicateStr = leafRefPath.match("(current.*)\]")[1];
        leafRefPath = leafRefPath.replace(predicateStr, searchValue);
    }
    return leafRefPath;
}

function cleanupFieldKeyArray (fieldKeyArray) {
    fieldKeyArray.map((fieldKey, fieldKeyIndex) => {
        fieldKeyArray[fieldKeyIndex] = fieldKey.replace(/.*\/(.*)/, '$1');
    });
    return fieldKeyArray;
}

export default function resolveLeafRefPath(catalogs, leafRefPath, fieldKey, path, container) {
    let pathCopy = _clone(path);
    // Strip any prefixes
    let leafRefPathCopy = leafRefPath.replace(/[\w\d]*:/g, '');
    // Strip any spaces
    leafRefPathCopy = leafRefPathCopy.replace(/\s/g, '');

    // resolve any current paths
    leafRefPathCopy = resolveCurrentPredicate(leafRefPathCopy, container, pathCopy);

    // Split on delimiter (/)
    const pathArray = leafRefPathCopy.split('/');

    let fieldKeyArray = fieldKey.split(':');

    // strip prepending qualifiers from fieldKeys
    fieldKeyArray = cleanupFieldKeyArray(fieldKeyArray);
    let results = [];

    // Check if relative path or not
    // TODO: Below works but
    // better to convert the pathCopy to absolute/rooted path 
    // and use the absolute module instead
    if (isRelativePath(leafRefPathCopy)) {
        let i = pathArray.length;
        while (pathArray[pathArray.length - i] == '..') {
            fieldKeyArray.splice(-1, 1);
            if (!isNaN(Number(fieldKeyArray[fieldKeyArray.length - 1]))) {
                // found a number, so an index. strip it
                fieldKeyArray.splice(-1, 1);
            }
            i--;
        }

        // traversed all .. - now traverse down
        if (fieldKeyArray.length == 1) {
            for (let key in catalogs) {
                for (let subKey in catalogs[key]) {
                    let found = _find(catalogs[key][subKey], {
                        id: fieldKeyArray[0]
                    });
                    if (found) {
                        results = getAbsoluteResults(found, pathArray.splice(-i, i));
                        return results;
                    }
                }
            }
        } else if (fieldKeyArray.length == 2) {
            for (let key in catalogs) {
                for (let subKey in catalogs[key]) {
                    console.log(key, subKey);
                    var found = _find(catalogs[key][subKey], {
                        id: fieldKeyArray[0]
                    });
                    if (found) {
                        for (let foundKey in found) {
                            if (_isArray(found[foundKey])) {
                                let topLevel = _find(found[foundKey], {
                                    id: fieldKeyArray[1]
                                });
                                if (topLevel) {
                                    results = getAbsoluteResults(topLevel, pathArray.splice(-i, i));
                                    return results;
                                }
                            } else {
                                if (foundKey == fieldKeyArray[1]) {
                                    results = getAbsoluteResults(found[foundKey], pathArray.splice(-i, i));
                                    return results;
                                }
                            }
                        }
                    }
                }
            }
        } else if (fieldKeyArray.length == 3) {
            for (let key in catalogs) {
                for (let subKey in catalogs[key]) {
                    let found = _find(catalogs[key][subKey], {
                        id: fieldKeyArray[0]
                    });
                    if (found) {
                        for (let foundKey in found) {
                            if (_isArray(found[foundKey])) {
                                let topLevel = _find(found[foundKey], {
                                    id: fieldKeyArray[1]
                                });
                                if (topLevel) {
                                    results = getAbsoluteResults(topLevel, pathArray.splice(-i, i));
                                    return results;
                                }
                            } else {
                                if (foundKey == fieldKeyArray[1]) {
                                    results = getAbsoluteResults(found[foundKey], pathArray.splice(-i, i));
                                    return results;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // not supported - too many levels deep ... maybe some day
            console.log('The relative path is from a node too many levels deep from root. This is not supported at the time');
        }
    } else {
        // absolute path
        if (pathArray[0] == "") {
            pathArray.splice(0, 1);
        }

        let catalogKey = pathArray[0];
        let topLevelObject = {};

        topLevelObject[catalogKey] = catalogs[catalogKey];

        results = getAbsoluteResults(topLevelObject, pathArray);

        return results;
    }
}
