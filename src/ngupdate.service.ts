import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as io from '@actions/io';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { Helpers } from './helpers';

export class PackageToUpdate {
    constructor(public name: string, public oldVersion: string, public newVersion: string) { }
}
export interface NgUpdateResult {
    packages: PackageToUpdate[],
    ngUpdateOutput: string,
    ngUpdateErrorOutput?: string
}

export class NgUpdateService {

    public static readonly NO_UPDATE_FOUND = '    We analyzed your package.json and everything seems to be in order. Good work!';
    public static readonly UPDATE_FOUND = '    We analyzed your package.json, there are some packages to update:';

    constructor(private projectPath: string) { }

    public async runUpdate(): Promise<NgUpdateResult> {

        let ngUpdateOutput = '';
        let ngUpdateErrorOutput = '';

        const ngUpdateOptions: ExecOptions = {
            listeners: {
                stdout: (data: Buffer) => ngUpdateOutput += data.toString(),
                stderr: (data: Buffer) => ngUpdateErrorOutput = data.toString()
            },
            cwd: this.projectPath
        };

        const npmRegistry = core.getInput('npm-registry');
        const ngUpdateArgs = npmRegistry ? [`registry=${npmRegistry}`] : [];

        core.debug(`🤖 Ensuring NPM modules are installed under '${this.projectPath}'...`);
        await Helpers.ensureNodeModules(this.projectPath, process.env['FORCE_INSTALL_NODE_MODULES']==='true');

        core.debug(`🤖 Running initial 'ng update${ngUpdateArgs}'...`);
        const ngExec = Helpers.getNgExecPath(this.projectPath);
        await exec.exec(`"${ngExec}"`, ['update', ...ngUpdateArgs], ngUpdateOptions);

        if (ngUpdateOutput.indexOf(NgUpdateService.NO_UPDATE_FOUND) > 0) {
            core.info('🤖 Congratulations 👏, you are already using the latest version of Angular!');
            return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
        } else if (ngUpdateOutput.indexOf(NgUpdateService.UPDATE_FOUND) > 0) {

            const ngUpdateRegEx = /\s+([@/a-zA-Z0-9]+)\s+(\d+\.\d+\.\d+)\s+->\s+(\d+\.\d+\.\d+)\s+ng update/gm;

            let pkgsToUpdate: PackageToUpdate[] = [];
            for (let match:RegExpExecArray|null; (match = ngUpdateRegEx.exec(ngUpdateOutput));) {
                pkgsToUpdate.push(new PackageToUpdate(match[1], match[2], match[3]));
            }

            if (pkgsToUpdate.length) {
                core.debug(`🤖 Updating outdated ng dependencies: ${pkgsToUpdate.map(p => `'${p.name}'`)}...`);
                const ngUpdatePkgsArgs = [ ...ngUpdateArgs, ...(pkgsToUpdate.map(p => p.name))];
                const ngUpdatePkgsOptions: ExecOptions = {
                    cwd: this.projectPath
                };
                await exec.exec(`"${ngExec}"`, ['update', ...ngUpdatePkgsArgs], ngUpdatePkgsOptions);
            }
            return { packages: pkgsToUpdate, ngUpdateOutput, ngUpdateErrorOutput };
        }

        if (ngUpdateErrorOutput.length) {
            core.warning('🤖 It looks like the "ng update" command failed.')
            core.warning(ngUpdateErrorOutput);
        }

        return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
    }

}