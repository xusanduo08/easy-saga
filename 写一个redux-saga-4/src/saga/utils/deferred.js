export default function(name){
  let def = {};
  def.promise = new Promise((resolve, reject) => {
    def.resolve = resolve;
    def.reject = reject;
  })
  def.name = name
  return def;
}