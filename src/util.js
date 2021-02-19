function checkPermission(require, permission) {
  /**
   * 有权限返回 true
   */
  const permissions = ['read', 'write', 'admin'];
  const requireNo = permissions.indexOf(require);
  const permissionNo = permissions.indexOf(permission);

  return requireNo <= permissionNo;
}

function dealStringToArr(para) {
  /**
   * in  'x1,x2,x3'
   * out ['x1','x2','x3']
   */
  let arr = [];
  if (para) {
    const paraArr = para.split(',');
    paraArr.forEach(it => {
      if (it.trim()) {
        arr.push(it.trim());
      }
    });
  }
  return arr;
}

function doVerifyFile(changeFile, forbidFiles, forbidPaths, allowedFiles, allowedPaths) {
  /**
   * changeFile 不允许，返回 true
   */
  let result = false;
  if (!forbidFiles && !forbidPaths && !allowedFiles && !allowedPaths) {
    return result;
  }

  if (forbidFiles) {
    const forbidFilesArr = dealStringToArr(forbidFiles);
    for (let i = 0; i < forbidFilesArr.length; i += 1) {
      if (changeFile === forbidFilesArr[i]) {
        result = true;
        break;
      }
    }
  }

  if (!result && forbidPaths) {
    const forbidPathsArr = dealStringToArr(forbidPaths);
    for (let i = 0; i < forbidPathsArr.length; i += 1) {
      if (changeFile.startsWith(forbidPathsArr[i])) {
        result = true;
        break;
      }
    }
  }

  let allowed = false;

  if (!result && allowedFiles) {
    const allowedFilesArr = dealStringToArr(allowedFiles);
    for (let i = 0; i < allowedFilesArr.length; i += 1) {
      if (!allowed && changeFile !== allowedFilesArr[i]) {
        result = true;
      } else {
        allowed = true;
        break;
      }
    }
  }

  if (!result && !allowed && allowedPaths) {
    const allowedPathsArr = dealStringToArr(allowedPaths);
    for (let i = 0; i < allowedPathsArr.length; i += 1) {
      if (!allowed && !changeFile.startsWith(allowedPathsArr[i])) {
        result = true;
      } else {
        allowed = true;
        break;
      }
    }
  }

  if (allowed) {
    return false;
  }

  return result;
}

// **********************************************************
module.exports = {
  checkPermission,
  dealStringToArr,
  doVerifyFile,
};
