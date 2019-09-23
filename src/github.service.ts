import * as core from '@actions/core';
import { GitHub } from '@actions/github';
import { Context } from '@actions/github/lib/context';
import * as helpers from './helpers';
import Octokit = require('@octokit/rest');


export class PullRequestService {

  private owner: string;
  private repo: string;
  private repoPath: string;
  constructor(private gbClient: GitHub, private context: Context) {
    this.repoPath = `${context.repo.owner}/${context.repo.repo}`;
    this.owner = context.repo.owner;
    this.repo = context.repo.repo;
  }

  public shouldIgnoreEvent(baseBranch: string): boolean {
    if (this.context.eventName == "push") {
      if (this.context.ref !== `refs/heads/${baseBranch}`) {
        core.debug(`🤖 Ignoring events not originating from base branch '${baseBranch}' (was '${this.context.ref}').`);
        return true;
      }
      // Ignore push events on deleted branches
      // The event we want to ignore occurs when a PR is created but the repository owner decides
      // not to commit the changes. They close the PR and delete the branch. This creates a
      // "push" event that we want to ignore, otherwise it will create another branch and PR on
      // the same commit.
      const deleted = this.context.payload['deleted'];
      if (deleted === 'true') {
        core.debug('🤖 Ignoring delete branch event.');
        return true;
      }
    }

    return false;
  }
  public async getOpenPR(base: string, head: string): Promise<number | null> {

    const res = await this.gbClient.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: 'open',
      base,
      head
    });

    for (let i = 0; i < res.data.length; i++)
      return res.data[i].number;

    return null;
  }

  public async createPR(base: string, head: string, title: string, body: string, assignees: string[], reviewers: string[], labels: string[]): Promise<number | null> {
    try {
      const createdPR = await this.gbClient.pulls.create({
        owner: this.owner,
        repo: this.repo,
        head,
        base,
        maintainer_can_modify: false,
        title,
        body
      });

      const prNumber = createdPR.data.number;

      core.debug(`🤖 [${this.repoPath}]#${prNumber} Created pull request`);

      await this.gbClient.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        assignees,
        labels,
        body
      });

      await this.addReviewers(prNumber, reviewers);

      core.debug(`🤖 [${this.repoPath}]#${prNumber} Updated pull request`);

      return prNumber;
    } catch (error) {
      core.error(`🤖 [${this.repoPath}] Create PR from ${head} failed`)
      core.setFailed(error);
      return null;
    }
  }

  private async  addReviewers(prNumber: number, reviewers: string[]) {
    if (!prNumber || !reviewers || reviewers.length === 0) return null;
    return this.gbClient.pulls.createReviewRequest({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      reviewers
    });
  }

}