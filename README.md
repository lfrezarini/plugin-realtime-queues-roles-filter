# Realtime Stats with permission schema

This plugin allows you to filter which realtime stats the current Flex user is going to see. It is common to use this schema with BPO permissioning. 


## How to use

1. Clone this repository
2. Copy `.env.example` to `.env` and set the following variables:
    - REACT_APP_SELECTION_ATTRIBUTE: attribute the plugin will check to select workers inside that permission group. The same attribute is checked in the current Flex user.
3. Copy `src/config/supervisors.example.json` to `src/config/supervisors.json`. This file contains the supervisors with the queues they are allowed to see. 
4. Check the following section to run and deploy your plugin.

**Note**: the attribute used to check workers in a queues is `routing.skills` array in the worker attributes. If you want to change that, replace this expression everywhere it is used.   

## Configuration 

### Setup

Make sure you have [Node.js](https://nodejs.org) as well as [`npm`](https://npmjs.com) installed.

Afterwards, install the dependencies by running `npm install`:

```bash
cd 

# If you use npm
npm install
```

### Development

In order to develop locally, you can use the Webpack Dev Server by running:

```bash
npm start
```

This will automatically start up the Webpack Dev Server and open the browser for you. Your app will run on `http://localhost:3000`. If you want to change that you can do this by setting the `PORT` environment variable:

```bash
PORT=3001 npm start
```

When you make changes to your code, the browser window will be automatically refreshed.

### Deploy

When you are ready to deploy your plugin, in your terminal run:

```bash
npm run deploy
```

This will publish your plugin as a Private Asset that is accessible by the Functions & Assets API. If you want to deploy your plugin as a Public Asset, you may pass --public to your deploy command:

```bash
npm run deploy --public
```

For more details on deploying your plugin, refer to the [deploying your plugin guide](https://www.twilio.com/docs/flex/plugins#deploying-your-plugin).

Note: Common packages like `React`, `ReactDOM`, `Redux` and `ReactRedux` are not bundled with the build because they are treated as external dependencies so the plugin will depend on Flex to provide them globally.