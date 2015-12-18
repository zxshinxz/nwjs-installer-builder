import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as del from 'del';
import * as ChildProcess from 'child_process';
import * as mkdirp from 'mkdirp';
import * as temp from 'temp';

temp.track();

const P = require( 'bluebird' );

export interface IBuilderOptions {
	appDirectory: string;
	outputDirectory: string;
	name: string;
	version: string;
	title: string;
	description?: string;
	authors: string;
	certFile?: string;
	certPassFile?: string;
	loadingGif: string;
	iconUrl: string;
	setupIcon: string;
	files: { [key: string]: string };
}

function _exec( cmd, args )
{
	return new P( ( resolve, reject ) =>
	{
		ChildProcess.execFile( cmd, args, ( err, stdout, stderr ) =>
		{
			if ( err || stderr ) {
				reject( err || stderr );
				return;
			}
			resolve( stdout );
		} );
	} );
}

let _mkdirp: ( dir: string ) => Promise<string> = P.promisify( mkdirp );

export class Builder
{
	constructor( private options: IBuilderOptions )
	{

	}

	async build()
	{
		let appDir = path.resolve( this.options.appDirectory );
		let outputDir = path.resolve( this.options.outputDirectory );
		let tmpDir = temp.mkdirSync( 'nwjs-installer-builder' );

		// Sanitize.
		this.options.version = this.options.version.replace( /^v/, '' );
		this.options.name = this.options.name.replace( / /, '' );

		await _mkdirp( tmpDir );

		let nuspecData = {
			name: this.options.name,
			version: this.options.version,
			title: this.options.title,
			description: this.options.description || '',
			authors: this.options.authors,
			iconUrl: this.options.iconUrl,
			copyright: `Copyright © ${new Date().getFullYear()} ${this.options.authors}`,
			files: '',
		};

		let files: string[] = [];
		_.forEach( this.options.files, ( file, key ) =>
		{
			files.push( `<file src="${key}" target="lib\\net45${file ? '\\' + file : ''}" />` );
		} );

		nuspecData.files = files.join( '\n' );

		let template = _.template( fs.readFileSync( path.resolve( __dirname, '..', 'resources', 'template.nuspec' ), 'utf8' ) );
		let nuspecCompiled = template( nuspecData );
		let nuspecPath = path.resolve( tmpDir, `${nuspecData.name}.nuspec` );
		fs.writeFileSync( nuspecPath, nuspecCompiled, 'utf8' );

		let cmd = path.resolve( __dirname, '..', 'vendor', 'nuget.exe' );
		let args = [
			'pack',
			nuspecPath,
			'-BasePath',
			appDir,
			'-OutputDirectory',
			tmpDir,
			'-NoDefaultExcludes',
		];

		let output = await _exec( cmd, args );

		cmd = path.resolve( __dirname, '..', 'vendor', 'Update.com' );
		args = [
			'--releasify',
			path.join( tmpDir, `${this.options.name}.${this.options.version}.nupkg` ),
			'--releaseDir',
			outputDir,
			'--loadingGif',
			path.resolve( this.options.loadingGif ),
			'--no-msi',
		]

		if ( this.options.certFile && this.options.certPassFile ) {
			args.push( '--signWithParams' );
			let pass = fs.readFileSync( this.options.certPassFile, 'utf8' );
			args.push( `/a /f "${path.resolve( this.options.certFile )}" /p "${pass.replace( '\n', '' )}"` );
		}

		if ( this.options.setupIcon ) {
			let iconPath = path.resolve( this.options.setupIcon );
			args.push( '--setupIcon' );
			args.push( iconPath );
		}

		await _exec( cmd, args );
	}
}
