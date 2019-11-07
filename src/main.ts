import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import { GithubService } from './github.service';
import { NgUpdateService } from './ngupdate.service';
import { GitService } from './git.service';
import { Helpers } from './helpers';

async function run() {
  try {
    const context = github.context;
    const repo = `${context.repo.owner}/${context.repo.repo}`;
    const repoToken = core.getInput('repo-token');
    const baseBranch = core.getInput('base-branch');
    const remoteUrl = `https://x-access-token:${repoToken}@github.com/${repo}`;
    const repoDir = process.env.GITHUB_WORKSPACE || ''; //TODO: if empty, manually checkout project
    const authorName = 'ngx-uptodate[bot]';
    const authorEmail = `ngx-uptodate@users.noreply.github.com`;
    const projectPath = path.normalize(path.join(repoDir, core.getInput('project-path')));

    const gbClient = new github.GitHub(repoToken);
    const ngService = new NgUpdateService(projectPath);
    const gitService = new GitService(repoDir);
    const gbService = new GithubService(gbClient, context);

    core.info(`🤖 Checking if received Github event should be ignored...`);
    if (gbService.shouldIgnoreEvent(baseBranch)) {
      return;
    }

    if (Helpers.isFolderEmpty(repoDir)) {
      
      const fetchDepth = core.getInput('fetch-depth');
      core.info(`🤖 Repo directory at: '${repoDir}' is empty. Checking out from: '${remoteUrl}'...`);
      await gitService.clone(remoteUrl, fetchDepth);
    }

    core.debug(`🤖 Intializing git config at: '${repoDir}'`);
    await gitService.init(remoteUrl, authorName, authorEmail);

    core.debug(`🤖 Moving git head to base branch: ${baseBranch}`);
    await gitService.checkoutBranch(baseBranch);

    const ngFilePath = path.join(projectPath, 'angular.json');
    const isNgProject = await Helpers.isFileExists(ngFilePath);
    if (!isNgProject) {
      core.warning(`🤖 Could not detect an Angular CLI project under "${projectPath}", exiting`);
      return;
    }

    core.info(`🤖 Prerequisites are done. Trying to 'ng update' your code now...`);
    const ngUpdateResult = await ngService.runUpdate();

    const prTitle = core.getInput('pr-title');
    const prBranchPrefix = core.getInput('pr-branch-prefix');

    if (gitService.hasChanges()) {
      const prBody = Helpers.getPrBody(core.getInput('pr-body'), ngUpdateResult.ngUpdateOutput);
      const prLabels = Helpers.getPrAssignees(core.getInput('pr-labels'));
      const prAssignees = Helpers.getPrAssignees(core.getInput('pr-assignees'));
      const prReviewers = Helpers.getPrReviewers(core.getInput('pr-reviewers'));

      const ngUpdateSha1 = await gitService.shortenSha1(Helpers.computeSha1(ngUpdateResult));
      const prBranch = `${prBranchPrefix.substring(0, prBranchPrefix.lastIndexOf('-'))}-${ngUpdateSha1}`;

      core.debug(`🤖 PR branch will be : ${prBranch}`);
      const remotePrBranchExists = await gitService.remoteBranchExists(prBranch);

      core.debug(`🤖 Moving git head to pr branch: ${prBranch}`);
      await gitService.cleanCheckoutBranch(prBranch, baseBranch, remotePrBranchExists);

      core.debug(`🤖 Committing changes to branch: '${prBranch}'`);
      await gitService.commit(prTitle);

      core.debug(`🤖 Pushing changes to pr branch: '${prBranch}'`);
      await gitService.push(prBranch, remotePrBranchExists); // will updated existing pr 

      core.debug(`🤖 Checking for existing open PR from '${prBranch}' to '${baseBranch}'...`);
      let prNumber = await gbService.getOpenPR(baseBranch,prBranch);

      if (prNumber) {
        core.debug(`🤖 PR from branch '${prBranch}' to '${baseBranch}' already existed (#${prNumber}). It's been simply updated.`);
      } else {
        core.debug(`🤖 Creating PR from branch '${prBranch}' to '${baseBranch}'`);
        prNumber = await gbService.createPR(baseBranch, prBranch, prTitle, prBody, prAssignees, prReviewers, prLabels);
      }

      if (prNumber)
        core.setOutput('pr-number', `'${prNumber}'`);
    }
    else
      core.info(`🤖 Running 'ng update' has produced no change in your code, you must be up-to-date already 👏!`)

    const deleteClosedPRBranches = core.getInput('delete-closed-pr-branches') == 'true';
    if(deleteClosedPRBranches){
        core.info(`🤖 Deleting branches related to closed PRs created by this action...`)
        await gbService.deleteClosedPRsBranches(baseBranch,prBranchPrefix, prTitle);
    }
    core.setOutput('ng-update-result', JSON.stringify(ngUpdateResult.packages));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
