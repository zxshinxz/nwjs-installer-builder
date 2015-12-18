import { Builder, IBuilderOptions } from './builder';
import * as chai from 'chai';
import * as path from 'path';
import * as del from 'del';
import * as fs from 'fs';
import * as _ from 'lodash';

const P = require( 'bluebird' );
const expect = chai.expect;

describe( 'Builder', () =>
{
	let testFiles = path.resolve( __dirname, '..', 'test-files' );

	it( 'should work', async () =>
	{
		let builder = new Builder( {
			appDirectory: path.resolve( testFiles, 'sources' ),
			outputDirectory: path.resolve( testFiles, 'cwd' ),
			name: 'MyApp',
			version: 'v1.2.1',
			title: 'My App',
			description: 'A Description',
			authors: 'Game Jolt Team',
			loadingGif: path.resolve( testFiles, 'sources', 'loading.gif' ),
			iconUrl: 'https://raw.githubusercontent.com/atom/electron/master/atom/browser/resources/win/atom.ico',
			setupIcon: path.resolve( testFiles, 'sources', 'winico.ico' ),
			files: {
				'app.exe': '',
				'locales\\**': 'locales',
				'node_modules\\**': 'node_modules',
				'package\\**': 'package',
				'package.json': '',
				'*.dll': '',
			}
		} );

		await builder.build();

		expect( fs.existsSync( path.resolve( testFiles, 'cwd', 'MyApp-1.2.1-full.nupkg' ) ) ).to.be.true;
		expect( fs.existsSync( path.resolve( testFiles, 'cwd', 'Setup.exe' ) ) ).to.be.true;
	} );
} );
