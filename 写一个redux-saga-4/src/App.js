import React, { Component } from 'react';
import {connect} from 'react-redux';
import './App.css';

class App extends Component {
  
  delayAdd(){
    this.props.dispatch({type:'START'});
  }

  render() {
    return (
      <div className="App">
        <p>点击按钮，延迟1s后下面的数字会加1，用到了take，call，delay，put四个方法</p>
        <button onClick={this.delayAdd.bind(this)} id='btn'>DoAsyncWork</button>
        <p>{this.props.count}</p>
      </div>
    );
  }
}

export default connect(state=>{
  return {count: state.count}
})(App);
