const path = require('path');

module.exports = {
  entry: './src/index.ts', // ponto de entrada da sua extensão
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'amd', // JupyterLab usa AMD
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: 'raw-loader', // permite importar SVG como string
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // para importar CSS
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/coreutils',
    '@jupyterlab/services',
    '@jupyterlab/ui-components',
    '@lumino/signaling',
    'react',
    'react-dom',
  ],
};
