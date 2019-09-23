
import * as path from 'path';
import * as exec from '@actions/exec';

import { NgUpdateService } from '../src/ngupdate.service';


describe('NgUpdateService Tests', () => {
    const testRootDir = path.join(process.cwd(), '__tests__');
    const resetFixtures = () => {
        //reset fixtures git status
        const fixtures = ['fxt-toupdate', 'fxt-uptodate'];
        fixtures.forEach(async (f) => {
            const fixtureDir = path.resolve(testRootDir, 'fixtures', f);
            const options = { cwd: fixtureDir };
            await exec.exec('git', ['checkout', 'HEAD', '--', `${fixtureDir}/`], options);
            await exec.exec('git', ['clean', '-fd'], options);
            console.log(`Reset git status of fixture at: '${fixtureDir}'`);
        });
    };

    //process.env['FORCE_INSTALL_NODE_MODULES'] = 'true';

    beforeAll(resetFixtures);
    afterAll(resetFixtures);

    it('runUpdate: should return packages to update if project is outdated', async () => {
        const projectPath = path.join(testRootDir, 'fixtures', 'fxt-toupdate');
        const ngUpdateService = new NgUpdateService(projectPath);
        const result = await ngUpdateService.runUpdate();

        expect(result.packages.map(p=>p.name)).toEqual(['@angular/cli', '@angular/core', 'rxjs']);
        expect(result.ngUpdateOutput).toContain(NgUpdateService.UPDATE_FOUND);
        expect(result.ngUpdateErrorOutput).toBeFalsy();
    }, 180000);

    it('runUpdate: should return no packages to update if project is up-to-date', async () => {
        const projectPath = path.join(testRootDir, 'fixtures', 'fxt-uptodate');
        const ngUpdateService = new NgUpdateService(projectPath);
        const result = await ngUpdateService.runUpdate();

        expect(result.packages.map(p=>p.name)).toEqual([]);
        expect(result.ngUpdateOutput).toContain(NgUpdateService.NO_UPDATE_FOUND);
        expect(result.ngUpdateErrorOutput).toBeFalsy();
    }, 180000);

});
