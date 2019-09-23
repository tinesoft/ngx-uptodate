import simplegit from 'simple-git/promise';


export class GitService {

    private git: simplegit.SimpleGit;

    private constructor(private repoDir: string) {
        this.git = simplegit(repoDir);
    }

    private async initGit(remoteUrl: string, authorName: string, authorEmail: string): Promise<void> {
        await this.git.addConfig('user.name', authorName);
        await this.git.addConfig('user.email', authorEmail);
        await this.git.remote(['set-url','origin', remoteUrl]);
    }

    public static async init(repoDir: string, remoteUrl: string, authorName: string, authorEmail: string): Promise<GitService> {
        const client = new GitService(repoDir);
        await client.initGit(remoteUrl, authorName, authorEmail);
        return client;
    }

    public async hasChanges(): Promise<boolean> {
        const status = await this.git.status();
        return !status.isClean();
    }

    public async remoteBranchExists(branch: string): Promise<boolean> {
        const remotes = await this.git.branch(['-r']);
        return remotes.all.includes(`origin/${branch}`);
    }

    public async clone(): Promise<void> {
        await this.git.clone(this.repoDir);
    }

    public async checkoutBranch(branch: string): Promise<void> {
        await this.git.checkout(branch);
    }

    public async cleanCheckoutBranch(branch: string, baseBranch: string, remoteExists:boolean): Promise<void> {
        if (remoteExists) {
            await this.git.stash(['--include-untracked']);
            await this.git.checkout(branch);
            await this.git.reset(['--hard', `origin/${baseBranch}`]);
            try {
                await this.git.stash(['pop']);
            } catch (e) {
                console.error(`error when unstashing: ${e.message}`)
                await this.git.checkout(['--theirs', '.']);
                await this.git.reset();
            }
        }
        else {
            await this.git.checkout(['-b', branch, 'HEAD']);
        }
    }

    public async raw(commands: string|string[]): Promise<string> {
        return await this.git.raw(commands);
    } 

    public async shortenSha1(sha1: string): Promise<string> {
        return await this.git.revparse(['--short', sha1]);
    }

    public async commit(message: string): Promise<void> {
        await this.git.add("./*");
        await this.git.commit(message);
    }

    public async push(branch: string, force?: boolean): Promise<void> {
        await this.git.push('origin', branch, {'--set-upstream':null, ...(force? {'--force':null}:{})});
    }
}