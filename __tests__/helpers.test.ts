
import * as path from 'path';
import { Helpers } from '../src/helpers';

describe('Helpers Tests', () => {
    const testRootDir = path.join(process.cwd(), '__tests__');

    it('isFileExists: should return "true" if file does exit on fs', async () => {
        const filePath = path.join(testRootDir, 'fixtures', 'fxt-toupdate', 'angular.json');
        expect(await Helpers.isFileExists(filePath)).toEqual(true);
    });

    it('isFileExists: should return "false" if file does not exist on fs', async () => {
        const filePath = path.join(testRootDir, 'fixtures', 'fxt-not-a-ng-project', 'missing.json');
        expect(await Helpers.isFileExists(filePath)).toEqual(false);
    });

    it('isFolderExist: should return "false" if folder is not empty',  () => {
        const folderPath = path.join(testRootDir, 'fixtures', 'fxt-toupdate');
        expect( Helpers.isFolderEmpty(folderPath)).toEqual(false);
    });

    it('isFolderExist: should throw error if file is not a folder',  () => {
        const notFolderPath = path.join(testRootDir, 'fixtures', 'fxt-toupdate','angular.json');
        expect(() => Helpers.isFolderEmpty(notFolderPath)).toThrowError(`ENOTDIR: not a directory, scandir '${notFolderPath}'`);
    });

    it('toList: should return empty array on empty value string', async () => {
        expect(await Helpers.toList("")).toEqual([]);
    });

    it('toList: should return empty array on undefined value string', async () => {
        expect(await Helpers.toList()).toEqual([]);
    });

    it('toList: should return a non empty array on value string separated with comma', async () => {
        expect(await Helpers.toList('ng,update, automated-pr,  bot')).toEqual(['ng','update','automated-pr','bot']);
    });

    it('getLocalNgExecPath: should return path to local "ng" executable', () => {
        expect(Helpers.getLocalNgExecPath('/path/to')).toEqual('/path/to/node_modules/@angular/cli/bin/ng');
    });
    
    it('computeSha1: should return SHA1 of given object', async () => {
        const obj = {
            "packages":[
               {
                  "name":"@angular/cli",
                  "oldVersion":"8.3.8",
                  "newVersion":"8.3.9"
               },
               {
                  "name":"@angular/core",
                  "oldVersion":"8.1.3",
                  "newVersion":"8.2.10"
               },
               {
                  "name":"rxjs",
                  "oldVersion":"6.4.0",
                  "newVersion":"6.5.3"
               }
            ],
            "ngUpdateOutput":"Using package manager: 'npm'\nCollecting installed dependencies...\nFound 30 dependencies.\n    We analyzed your package.json, there are some packages to update:\n    \n      Name                               Version                  Command to update\n     --------------------------------------------------------------------------------\n      @angular/cli                       8.3.8 -> 8.3.9           ng update @angular/cli\n      @angular/core                      8.1.3 -> 8.2.10          ng update @angular/core\n      rxjs                               6.4.0 -> 6.5.3           ng update rxjs\n",
            "ngUpdateErrorOutput":""
         };

        expect(await Helpers.computeSha1(obj)).toEqual('603ff3c3931dbb11cd3ce63ec0426040dd2aa0cd');
    });
});