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

    public async checkoutBranch(branch: string, remoteExists?: boolean): Promise<void> {
        if (remoteExists) {
            await this.git.stash(['--include-untracked']);
            await this.git.checkout(branch);
            await this.git.reset(['--hard', 'develop']);
            try {
                this.git.stash(['pop']);
            } catch (e) {
                this.git.checkout(['--theirs', '.']);
                this.git.reset();
            }
        }
        else if(remoteExists === false)
            this.git.checkout(['-b', branch, 'HEAD']);
        else//undefined, simply checkout the existing branch
            this.git.checkout(branch);
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
        await this.git.push('origin', branch, [...(force ? ['--force'] : []), '--set-upstream']);
    }
}