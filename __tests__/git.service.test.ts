
import * as path from 'path';
import { GitService } from '../src/git.service';


describe('GitService Tests', () => {
    const testRootDir = path.join(process.cwd(), '__tests__');

    it('hasChanges: should return "false" when no file has changed in the project directory', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const remoteUrl = 'https://x-access-token:TOKEN@github.com/tinesoft/ngx-uptodate'
        const gitService = await GitService.init(repoDir, remoteUrl,'github-actions','github-actions@users.noreply.github.com');
        expect(await gitService.hasChanges()).toEqual(false);
    });

    it('hasChanges: should return "true" when a file in project has been modified', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-modified');
        const remoteUrl = 'https://x-access-token:TOKEN@github.com/tinesoft/ngx-uptodate'
        const gitService =  await GitService.init(repoDir, remoteUrl, 'github-actions','github-actions@users.noreply.github.com');
        expect(await gitService.hasChanges()).toEqual(true);
    });

    it('shortenSha1: should return short version of given sha1 string', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const remoteUrl = 'https://x-access-token:TOKEN@github.com/tinesoft/ngx-uptodate'
        const gitService =  await GitService.init(repoDir, remoteUrl, 'github-actions','github-actions@users.noreply.github.com');
        const sha1 = '3a5c39d9f86aff7698ce6cf4d46d6468db504fb3';
        expect(await gitService.shortenSha1(sha1)).toEqual("3a5c39d");
    });
});
