
import { take, delay, put, call} from './saga/effects.js';

function *main(){
  yield delay(1000);
  yield put({type:'ADD'})
}

function* root(){
  while(true){
    yield take('START');
    yield call(main);
  }
}

export default root;