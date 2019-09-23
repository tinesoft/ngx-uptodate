import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

describe('Main Tests', () => {

    // shows how the runner will run a javascript action with env / stdout protocol
    xit('should run main code', () => {
        const ip = path.join(__dirname, '..', 'lib', 'main.js');
        const repoDir = path.join(__dirname, 'fixtures', 'fxt-toupdate');

        let result;
        try {
            result = cp.execSync(`node ${ip}`, {
                env: { 
                    'FORCE_INSTALL_NODE_MODULES': 'true',
                    'GITHUB_REPOSITORY': 'tinesoft/ngx-uptodate', //required by github.context
                    'GITHUB_WORKSPACE' : `${repoDir}`,
                    'INPUT_BASE-BRANCH': 'master',
                    'INPUT_PR-TITLE': 'chore(ng-update): update angular dependencies',
                    'INPUT_PR-BODY': '[ngx-uptodate](https://github.com/tinesoft/ngx-uptodate) 🤖 has automatically run `ng update` for you and baked this hot 🔥 PR , ready to merge.',
                    'INPUT_PR-BRANCH-PREFIX': 'chore-ng-update-',
                }
            }).toString();
        }
        catch(e){
            console.debug(`Exec Result: >${result}<`);
            console.debug(`Exec stdout: >${e.output.toString()}<`);
            console.error(`Exec stderr: >${e.stderr.toString()}<`);
            throw e;
        };
    });

});
