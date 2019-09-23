import gulp from 'gulp';
import pump from 'pump';
import del from 'del';
import jest from 'jest';
import { join, resolve} from 'path';
import { lstatSync, readdirSync }  from 'fs';

import gulpCoveralls from 'zyan-gulp-coveralls';
import { execExternalCmd } from './utility/helpers';

const config = {
  srcDir: 'src',
  buildDir: 'lib',
  fixturesDir: '__tests__/fixtures',
  coverageDir: 'coverage',
  indentSpaces: 2
};

// Cleaning tasks
export const cleanBuild = () => del([config.buildDir]);
cleanBuild.description = `Clean the build directory '${config.buildDir}/'`;

export const cleanCoverage = () => del([config.coverageDir]);
cleanCoverage.description = `Clean the coverage directory '${config.coverageDir}/'`;

export const clean = gulp.parallel(cleanBuild, cleanCoverage);
clean.description = `Clean all directories: '${config.buildDir}/', '${config.coverageDir}/'`;

// Compiling tasks

export const compile = () => execExternalCmd('npm', 'run build');
compile.description = `Compile *.ts  files in '${config.srcDir}/'`;

// Testing tasks
export const test = () => {
  let isTravis = !!process.env.TRAVIS;
  return jest.runCLI({ config: require('./package.json').jest, coverage: true, runInBand: isTravis, ci: isTravis }, ".")
    .then(({ results }) => {
      if (!results.success) throw new Error('There are test failures!');
    });
}
test.description = `Run *.spec.ts test files located in '${config.srcDir}/' using Jest`;

export const coveralls = (done) => {
  if (!process.env.CI) {
    done();
  }

  pump(
    [
      gulp.src(`${config.coverageDir}/lcov.info`),
      gulpCoveralls()
    ], done);
}
coveralls.description = `Upload coverage report on coveralls.io, when run on Travis CI`;

//Releasing tasks
export const release = () => execExternalCmd('npm', 'run semantic-release');
release.description = `Semantically release project at '${config.buildDir}/'`;

export const build = gulp.series(clean, compile, test);
build.description = `Builds the project into '${config.buildDir}/'`;

// Fixtures tasks
export const resetFixtures = async () => {
  const fixturesDir = join(process.cwd(), config.fixturesDir);
  readdirSync(fixturesDir)//
    .filter(f => lstatSync(resolve(fixturesDir,f)).isDirectory())//
    .map(async (name) => {
      if(name == 'fxt-modified')
        return;

      let fixtureDir = join(fixturesDir, name);
      console.log(`Reseting fixture at: ${fixtureDir}`);
      await execExternalCmd('git', `checkout HEAD -- ${fixtureDir}/`);
      await execExternalCmd('git', `clean -fd ${fixtureDir}/`);
  });

};
resetFixtures.description = `Reset the fixtures to their initial git status`;

export default build; //default task
