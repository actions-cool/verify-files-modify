const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const github = require('@actions/github');

const { checkPermission, doVerifyFile } = require('./util.js');

// *****************************************
const token = core.getInput('token');
const octokit = new Octokit({ auth: `token ${token}` });
const context = github.context;

const FIXED = '<!-- Created by actions-cool/verify-files-modify. Do not remove. -->';

// *****************************************
async function run() {
  try {
    if (context.eventName === 'pull_request_target' || context.eventName === 'pull_request') {
      const { owner, repo } = context.repo;
      const number = context.payload.pull_request.number;
      const creator = context.payload.pull_request.user.login;

      const skipVerifyAuthority = core.getInput('skip-verify-authority');

      const comment = core.getInput('comment');
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

      let result = true;

      if (skipVerifyAuthority) {
        result = await checkAuthority();
      }

      if (!result) {
        const changeFiles = await getFiles();
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
          }
        }
      }

      core.info(`The check result is ${result}.`);

      if (!result && context.eventName === 'pull_request_target') {
        let ifHasComment = false;
        let commentId;
        const commentData = await octokit.issues.listComments({
          owner,
          repo,
          issue_number: number,
        });

        const commentsArr = commentData.data;
        for (let i = 0; i < commentsArr.length; i++) {
          if (commentsArr[i].body.includes(FIXED)) {
            ifHasComment = true;
            commentId = commentsArr[i].id;
            break;
          }
        }

        const body = `${comment}\n\n${FIXED}`;

        if (comment && ifHasComment) {
          await octokit.issues.updateComment({
            owner,
            repo,
            comment_id: commentId,
            body,
          });
          core.info(`update-comment!`);
        } else if (comment) {
          await octokit.issues.createComment({
            owner,
            repo,
            issue_number: number,
            body,
          });
          core.info(`create-comment!`);
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

        core.setFailed(
          `You have modified a disabled file or paths, please check! See .github/Workflows/verify-files-modify.yml !`,
        );
      } else if (!result && context.eventName === 'pull_request') {
        core.setFailed(
          `You have modified a disabled file or paths, please check! See .github/Workflows/verify-files-modify.yml !`,
        );
      }
    } else {
      core.setFailed(`This Action only support "pull_request" or "pull_request_target"!`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
