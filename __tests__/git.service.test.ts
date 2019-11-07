
import * as path from 'path';
import * as fs from 'fs';
import { GitService } from '../src/git.service';


describe('GitService Tests', () => {
    const testRootDir = path.join(process.cwd(), '__tests__');

    xit('clone: should clone the repository into base dir', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'ngx-uptodate-demo');
        
        try     { fs.rmdirSync(repoDir);}
        catch   { }
        finally { fs.mkdirSync(repoDir);}

        const gitService = new GitService(repoDir);
        await gitService.clone('https://github.com/tinesoft/ngx-uptodate-demo.git');
        expect(fs.readdirSync(repoDir).length>0).toEqual(true);
    });

    it('hasChanges: should return "false" when no file has changed in the project directory', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const gitService = new GitService(repoDir);
        expect(await gitService.hasChanges()).toEqual(false);
    });

    it('hasChanges: should return "true" when a file in project has been modified', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-modified');
        const gitService = new GitService(repoDir);
        expect(await gitService.hasChanges()).toEqual(true);
    });

    it('shortenSha1: should return short version of given sha1 string', async () => {
        const repoDir = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const gitService = new GitService(repoDir);
        const sha1 = '3a5c39d9f86aff7698ce6cf4d46d6468db504fb3';
        expect(await gitService.shortenSha1(sha1)).toEqual("3a5c39d");
    });
});
