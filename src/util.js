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

function doVerifyFile(changeFile, verifyFiles, verifyPaths) {
  /**
   * changeFile 被包含，返回 true
   */
  let result = false;
  if (!verifyFiles && !verifyPaths) {
    return result;
  }

  if (verifyFiles) {
    const verifyFilesArr = dealStringToArr(verifyFiles);
    for (let i = 0; i < verifyFilesArr.length; i += 1) {
      if (changeFile === verifyFilesArr[i]) {
        result = true;
        break;
      }
    }
  }

  if (!result && verifyPaths) {
    const verifyPathsArr = dealStringToArr(verifyPaths);
    for (let i = 0; i < verifyPathsArr.length; i += 1) {
      if (changeFile.startsWith(verifyPathsArr[i])) {
        result = true;
        break;
      }
    }
  }

  return result;
}

// **********************************************************
module.exports = {
  checkPermission,
  dealStringToArr,
  doVerifyFile,
};
