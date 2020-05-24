
import * as path from 'path';
import * as exec from '@actions/exec';

import { NgUpdateService } from '../src/ngupdate.service';


describe('NgUpdateService Tests', () => {
    const testRootDir = path.join(process.cwd(), '__tests__');
    const fixtures = ['fxt-toupdate', 'fxt-uptodate'];

    const resetFixturesGitStatus = async () => {
        //reset fixtures git status
        await Promise.all(fixtures.map(async (f)  => {
            const fixtureDir = path.resolve(testRootDir, 'fixtures', f);
            const options = { cwd: fixtureDir };
            console.log(`Resetting git status of fixture at: '${fixtureDir}'...`);
            await exec.exec('git', ['checkout', 'HEAD', '--', `${fixtureDir}/`], options);
            await exec.exec('git', ['clean', '-fd'], options);
            console.log(`Reset git status of fixture at: '${fixtureDir}'`);
        }));
    };

    const resetFixturesNodeModules = async () =>{
        //reinstall node modules, to ensure that the right ng binary is installed/used for the 'ng update' check
        await Promise.all(fixtures.map(async (f)  => {
            if(f === 'fxt-uptodate')
                return;
            const fixtureDir = path.resolve(testRootDir, 'fixtures', f);
            const options = { cwd: fixtureDir };
            console.log(`Reinstalling Node modules of fixture at: '${fixtureDir}'...`);
            await exec.exec('npm', ['ci'], options);
            console.log(`Reinstalled Node modules of fixture at: '${fixtureDir}'`);
        }));
    };

    const resetFixtures = async () => {
        console.log('Resetting fixtures...');
        await resetFixturesGitStatus();
        await resetFixturesNodeModules(); 
    }

    //process.env['FORCE_INSTALL_NODE_MODULES'] = 'true';//deactivate because time consuming, reactivate if 'runUpdate1' fails (ng binary probably out-to-date)

    beforeAll(resetFixtures, 600000);
    afterAll(resetFixturesGitStatus, 600000);

    it('runUpdate1: should return packages to update if project is outdated', async () => {
        const projectPath = path.join(testRootDir, 'fixtures', 'fxt-toupdate');
        const ngUpdateService = new NgUpdateService(projectPath);
        const result = await ngUpdateService.runUpdate();

        expect(result.packages.map(p=>p.name)).toEqual(['@angular/cli', '@angular/core', 'rxjs']);
        expect(result.ngUpdateOutput).toContain(NgUpdateService.UPDATE_FOUND);
        expect(result.ngUpdateErrorOutput).toBeFalsy();
    }, 300000);

    it('runUpdate2: should return no packages to update if project is up-to-date', async () => {
        const projectPath = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const ngUpdateService = new NgUpdateService(projectPath);
        const result = await ngUpdateService.runUpdate();

        expect(result.packages.map(p=>p.name)).toEqual([]);
        expect(result.ngUpdateOutput).toContain(NgUpdateService.NO_UPDATE_FOUND);
        expect(result.ngUpdateErrorOutput).toBeFalsy();
    }, 300000);

});
