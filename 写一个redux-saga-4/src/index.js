import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import reducer from './reducer';
import saga from './sagas';

import sagaMiddlewareFactory from './saga/sagaMiddlewareFactory';

const easySaga = sagaMiddlewareFactory();

const store = createStore(reducer,{count: 0}, applyMiddleware(easySaga));
easySaga.run(saga);

ReactDOM.render(<Provider store={store}>
    <App />
    </Provider>, document.getElementById('root'));

serviceWorker.unregister();
