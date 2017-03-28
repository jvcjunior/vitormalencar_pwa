const glob = require('glob');
const { join } = require('path');
const webpack = require('webpack');
const Copy = require('copy-webpack-plugin');
const HTML = require('html-webpack-plugin');
const Clean = require('clean-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const Dashboard = require('webpack-dashboard/plugin');
const SWPrecache = require('sw-precache-webpack-plugin');
const ExtractText = require('extract-text-webpack-plugin');
const CnameWebpackPlugin = require('cname-webpack-plugin');
const CriticalPlugin = require('webpack-plugin-critical').CriticalPlugin;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


const uglify = require('./uglify');
const babel = require('./babel');

const root = join(__dirname, '..');

module.exports = isProd => {
	// base plugins array
	const plugins = [
		new Clean(['dist'], { root }),
		new Copy([{ context: 'src/static/', from: '**/*.*' }]),
		new webpack.optimize.CommonsChunkPlugin({ name: 'vendor' }),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
		}),
		new HTML({ template: 'src/index.html' }),
		new webpack.LoaderOptionsPlugin({
			options: {
				babel,
				postcss: [
					require('autoprefixer')({ browsers: ['last 3 version'] })
				]
			}
		})
	];

	if (isProd) {
		babel.presets.push('babili');

		plugins.push(
			new webpack.LoaderOptionsPlugin({ minimize: true, debug: false }),
			new webpack.optimize.UglifyJsPlugin(uglify),
			new ExtractText('styles.[hash].css'),
			new PurifyCSSPlugin({
				paths: glob.sync(join(__dirname, 'src/*.html')),
				moduleExtensions:['.html','.js'],
				verbose: true,
				minimize: true
			}),
			new CriticalPlugin({
		    src: 'index.html',
		    inline: true,
		    minify: true,
		    dest: 'index.html'
  	}),
			new SWPrecache({
				minify: true,
				filename: 'service-worker.js',
				dontCacheBustUrlsMatching: /./,
				navigateFallback: 'index.html',
				staticFileGlobsIgnorePatterns: [/\.map$/],
				runtimeCaching: [{
          handler: 'cacheFirst',
					urlPattern: /\.googleapis\.com\//,
        }]
			}),
			new CnameWebpackPlugin({
					 domain: 'www.vitormalencar.com'
			 })
		);
	} else {
		// dev only
		plugins.push(
			new webpack.HotModuleReplacementPlugin(),
			new webpack.NamedModulesPlugin(),
			new Dashboard()
		);
	}

	return plugins;
};
