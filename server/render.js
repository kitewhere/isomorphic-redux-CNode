import {renderToString} from 'react-dom/server';
import qs from 'qs';
import {Provider} from 'react-redux';
import reducerApp from '../common/reducers/index';
import React from 'react';
import {RoutingContext,match} from 'react-router';
import {selectAuthor,fetchPostsIfNeeded} from '../common/actions/actions'
import storeApp from '../common/configStore';
import routesApp from '../common/routes';
import fetch from 'isomorphic-fetch'
import fs from 'fs';
import path from 'path';


function renderFullPage(html,initState){
    const main = JSON.parse(fs.readFileSync(path.join(__dirname,'../webpack/webpack-assets.json'))).javascript.main;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>react-ssr</title>
        </head>
        <body>
            <div id="container"><div>${html}</div></div>
            <script>
                window.__INITIAL_STATE__ = ${JSON.stringify(initState)}
            </script>
            <script src=${main}></script>
        </body>
        </html>
    `
}

export default function handleRender(req,res){
    console.log('我进入到这里来了')
    match({routes:routesApp,location:req.url},(err,redirectLocation,renderProps)=>{
        if(err){
            res.status(500).end(`server error: ${err}`)
        } else if(redirectLocation){
            res.redirect(redirectLocation.pathname+redirectLocation.search)
        } else if(renderProps){
            const store = storeApp({});
            console.log('查看初始state')
            console.log(store.getState())
            Promise.all([
                store.dispatch(selectAuthor('all')),
                store.dispatch(fetchPostsIfNeeded('all'))
            ])
            .then(()=>{
                const html = renderToString(
                    <Provider store={store}>
                        <RoutingContext {...renderProps}/>
                    </Provider>
                )
                const finalState = store.getState();
                res.end(renderFullPage(html,finalState));
            })
        } else {
            res.status(404).end('404 not found')
        }
    })
}