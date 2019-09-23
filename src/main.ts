import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import { PullRequestService as GithubService } from './github.service';
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
    const authorName = process.env.GITHUB_ACTOR || 'ngx-uptodate';
    const authorEmail = `${authorName}@users.noreply.github.com`;
    const projectPath = path.normalize(path.join(repoDir, core.getInput('project-path')));

    const gbClient = new github.GitHub(repoToken);
    const ngService = new NgUpdateService(projectPath);
    const gitService = await GitService.init(repoDir,remoteUrl, authorName, authorEmail);
    const gbService = new GithubService(gbClient, context);

    if (gbService.shouldIgnoreEvent(baseBranch)) {
      return;
    }

    await gitService.checkoutBranch(baseBranch);

    const ngFilePath = path.join(projectPath, 'angular.json');
    const isNgProject = await Helpers.isFileExists(ngFilePath);
    if (!isNgProject) {
      core.warning(`🤖 Could not detect an Angular CLI project under "${projectPath}", exiting`);
      return;
    }

    const ngUpdateResult = await ngService.runUpdate();

    if (gitService.hasChanges()) {
      const prTitle = core.getInput('pr-title');
      const prBranchPrefix = core.getInput('pr-branch-prefix');
      const prBody = Helpers.getPrBody(core.getInput('pr-body'), ngUpdateResult.ngUpdateOutput);
      const prLabels = Helpers.getPrAssignees(core.getInput('pr-labels'));
      const prAssignees = Helpers.getPrAssignees(core.getInput('pr-assignees'));
      const prReviewers = Helpers.getPrReviewers(core.getInput('pr-reviewers'));

      const ngUpdateSha1 = await gitService.shortenSha1(Helpers.computeSha1(ngUpdateResult));
      const prBranch = `${prBranchPrefix.substring(0, prBranchPrefix.lastIndexOf('-'))}-${ngUpdateSha1}`;

      core.debug(`🤖 PR branch would be : ${prBranch}`);
      const remotePrBranchExists = await gitService.remoteBranchExists(prBranch);

      core.debug(`🤖 Moving git head to branch: ${prBranch}`);
      await gitService.checkoutBranch(prBranch, remotePrBranchExists);

      core.debug(`🤖 Committing changes to branch: '${prBranch}'`);
      await gitService.commit(prTitle);

      core.debug(`🤖 Pushing changes to branch: '${prBranch}'`);
      await gitService.push(prBranch, remotePrBranchExists); //will updated existing pr if exists

      if (!remotePrBranchExists) {
        core.debug(`🤖 Creating PR from branch: 'origin/${prBranch}' to 'origin/${baseBranch}'`);
        await gbService.createPR(baseBranch, prBranch, prTitle, prBody, prAssignees, prReviewers, prLabels);
      }
    }
    else
      core.debug('🤖 No update was found, aborting')

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
