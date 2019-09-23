import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

describe('Main Tests', () => {

    // shows how the runner will run a javascript action with env / stdout protocol
    it('should run main code', () => {
        const ip = path.join(__dirname, '..', 'lib', 'main.js');
        const repoDir = path.join(__dirname, 'fixtures', 'fxt-toupdate');

        let result;
        try {
            result = cp.execSync(`node ${ip}`, {
                env: { 
                    'GITHUB_REPOSITORY': 'tinesoft/ngx-uptodate', //required by github.context
                    'GITHUB_WORKSPACE' : `${repoDir}`
                }
            }).toString();
        }
        catch(e){
            console.debug(`Exec Result: >${result}<`);
            console.debug(`Exec stdout: >${e.output.toString()}<`);
            console.debug(`Exec stderr: >${e.stderr.toString()}<`);
            throw e;
        };
    });

});
