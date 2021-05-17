const { dealStringToArr } = require('actions-util');

function doVerifyFile(changeFile, forbidFiles, forbidPaths, allowedFiles, allowedPaths) {
  /**
   * changeFile 不允许，返回 true
   */
  console.log(`[VerifyFile: ${changeFile} begin!]`);
  let result = false;
  if (!forbidFiles && !forbidPaths && !allowedFiles && !allowedPaths) {
    return result;
  }

  if (forbidFiles) {
    const forbidFilesArr = dealStringToArr(forbidFiles);
    for (let i = 0; i < forbidFilesArr.length; i += 1) {
      if (changeFile === forbidFilesArr[i]) {
        console.log(`[VerifyFile: ${changeFile} === ${forbidFilesArr[i]}. Sorry!]`);
        result = true;
        break;
      }
    }
  }

  if (!result && forbidPaths) {
    const forbidPathsArr = dealStringToArr(forbidPaths);
    for (let i = 0; i < forbidPathsArr.length; i += 1) {
      if (changeFile.startsWith(forbidPathsArr[i])) {
        console.log(`[VerifyFile: ${changeFile}.startsWith(${forbidPathsArr[i]}). Sorry!]`);
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
        console.log(`[VerifyFile: ${changeFile} === (${allowedFilesArr[i]}). Good!]`);
        allowed = true;
        break;
      }
    }
  }

  if (allowed) {
    return false;
  }

  if (!result && !allowed && allowedPaths) {
    const allowedPathsArr = dealStringToArr(allowedPaths);
    for (let i = 0; i < allowedPathsArr.length; i += 1) {
      if (!allowed && !changeFile.startsWith(allowedPathsArr[i])) {
        result = true;
      } else {
        console.log(`[VerifyFile: ${changeFile}.startsWith(${allowedPathsArr[i]}). Good!]`);
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
  doVerifyFile,
};
