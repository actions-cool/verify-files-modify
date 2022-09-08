const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const github = require('@actions/github');

const { checkPermission, dealStringToArr, THANKS } = require('actions-util');
const { doVerifyFile } = require('./util.js');

// *****************************************
const token = core.getInput('token');
const octokit = new Octokit({ auth: `token ${token}` });
const context = github.context;

const FIXED = 'Created by actions-cool/verify-files-modify. Do not remove.';
const InfoMessage =
  'You have modified a disabled file or paths, please check! See .github/Workflows/verify-files-modify.yml';

// *****************************************
async function run() {
  try {
    if (context.eventName === 'pull_request_target' || context.eventName === 'pull_request') {
      const { owner, repo } = context.repo;
      const number = context.payload.pull_request.number;
      const creator = context.payload.pull_request.user.login;
      const labels = context.payload.pull_request.labels;

      const skipVerifyAuthority = core.getInput('skip-verify-authority');
      const skipVerifyUsers = core.getInput('skip-verify-users');
      const skipLabel = core.getInput('skip-label');
      const setFailedInput = core.getInput('set-failed');

      if (skipLabel && labels && labels.length) {
        const labelsName = labels.map(({ name }) => name);
        if (labelsName.includes(skipLabel)) {
          core.info(`Actions: The ${skipLabel} is in ${JSON.stringify(labelsName)}. Do skip!`);
          return false;
        }
      }

      if (skipVerifyUsers && dealStringToArr(skipVerifyUsers).includes(creator)) {
        core.info(`Actions: The creator ${creator} is in ${skipVerifyUsers}. Do skip!`);
        return false;
      }

      const comment = core.getInput('comment');
      const commentMark = core.getInput('comment-mark');
      const assignees = core.getInput('assignees');
      const close = core.getInput('close');

      const forbidFiles = core.getInput('forbid-files');
      const forbidPaths = core.getInput('forbid-paths');
      const allowedFiles = core.getInput('allowed-files');
      const allowedPaths = core.getInput('allowed-paths');

      async function getFiles(page = 1) {
        let { data } = await octokit.pulls.listFiles({
          owner,
          repo,
          pull_number: number,
          per_page: 100,
          page,
        });
        if (data.length >= 100) {
          data = data.concat(await getFiles(page + 1));
        }
        return data;
      }

      async function checkAuthority() {
        let out;
        const res = await octokit.repos.getCollaboratorPermissionLevel({
          owner,
          repo,
          username: creator,
        });
        const { permission } = res.data;
        out = checkPermission(skipVerifyAuthority, permission);
        core.info(`The user ${creator} check auth ${out}!`);
        return out;
      }

      let result = false;

      if (skipVerifyAuthority) {
        result = await checkAuthority();
      }

      if (!result) {
        const changeFiles = await getFiles();
        if (changeFiles.length == 0) {
          return false;
        }
        for (let i = 0; i < changeFiles.length; i += 1) {
          if (
            doVerifyFile(
              changeFiles[i].filename,
              forbidFiles,
              forbidPaths,
              allowedFiles,
              allowedPaths,
            )
          ) {
            result = false;
            break;
          } else {
            result = true;
          }
        }
      }

      core.info(`The check result is ${result}.`);

      function coreResult() {
        setFailedInput == 'false' ? core.info(InfoMessage) : core.setFailed(InfoMessage);
      }

      if (!result && context.eventName === 'pull_request_target') {
        let ifHasComment = false;
        let commentId;
        const commentData = await octokit.issues.listComments({
          owner,
          repo,
          issue_number: number,
        });

        let commentFixed = `<!-- ${FIXED} -->`;
        if (commentMark) {
          commentFixed = `<!-- ${FIXED} ${commentMark} -->`;
        }

        const commentsArr = commentData.data;
        for (let i = 0; i < commentsArr.length; i++) {
          if (commentsArr[i].body.includes(commentFixed)) {
            ifHasComment = true;
            commentId = commentsArr[i].id;
            break;
          }
        }

        const body = `${comment}\n\n${commentFixed}`;

        if (comment && ifHasComment) {
          await octokit.issues.updateComment({
            owner,
            repo,
            comment_id: commentId,
            body,
          });
          core.info(`Actions: [update-comment] success!`);
        } else if (comment) {
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number: number,
            body,
          });
          core.info(`Actions: [create-comment] success!`);
        }

        if (assignees) {
          await octokit.issues.addAssignees({
            owner,
            repo,
            issue_number: number,
            assignees: dealStringToArr(assignees),
          });
          core.info(`Actions: [add-assignees][${assignees}] success!`);
        }

        if (close == 'true') {
          await octokit.issues.update({
            owner,
            repo,
            issue_number: number,
            state: 'closed',
          });
          core.info(`Actions: [close-pr][${number}] success!`);
        }

        coreResult();
      } else if (!result && context.eventName === 'pull_request') {
        coreResult();
      }
    } else {
      core.setFailed(`This Action only support "pull_request" or "pull_request_target"!`);
    }
    core.info(THANKS);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
