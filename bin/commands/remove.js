require('colors');
var cli = require('optimist'),
    p = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec;

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

var rmDir = function(path) {
  var files = [];
  if( fs.existsSync(path) ) {
    files = fs.readdirSync(path);
    files.forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        rmDir(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// Basic CLI
var argv = cli
    .usage('Usage: ngn remove <module or group>')
    .argv,
  mod = argv._.filter(function(value){return value !== 'remove'})[0];

// Global Package Installer
var uninstall = function(ngnpkg){
  var path = p.join(__dirname,'..','..','..',ngnpkg);
  if (fs.existsSync(path)){
    var v = require(p.join(path,'package.json')).version;
    try {
      rmDir(path);
      console.log((ngnpkg+' support removed --> '+' v'+v).red.bold);
    } catch (e) {
      if (e.message.toString().toLowerCase().indexOf('permission') >= 0){
        console.log('You have insufficient permission to remove modules.'.red.bold);
        if (require('os').platform() == 'win32'){
          console.log('\nPlease run this command with an admin account.'.yellow.bold);
        } else {
          console.log('\nPlease run this command as root (or sudo).'.yellow.bold);
        }
      }
    }
  } else {
    console.log((ngnpkg+' support not found/installed. Skipped.').yellow);
  }
  /*exec('npm uninstall -g '+ngnpkg+' --json --loglevel=silent',function(err,stdout,stderr){
    if (stdout.toString().trim().length == 0){
      console.log((ngnpkg+' support not found/installed. Skipped.').yellow);
      return;
    }
    try {
      var out = stdout.toString().trim().replace(/unbuild/gi,'').replace(/\s/,'').split('@');
      console.log(((out[0]||'Unknown').toString()+' support removed --> '+' v'+(out[1]||'?').toString()).red.bold);
    } catch (e) {
      console.log('Module removed, but there were errors:'.yellow.bold);
      console.log(e.message.toString().yellow);
    }
  });*/
};

// Check first for a module or group and install/warn accordingly
if (available.modules[mod] !== undefined){
  uninstall(mod);
} else if (available.groups[mod] !== undefined){
  available.groups[mod].forEach(function(m){
    uninstall(m);
  });
} else if (['all','*'].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log(('Removing every add-on ('+Object.keys(available.modules).length.toString()+' total). This may take a few moments.').cyan.bold);
  for (var m in available.modules){
    uninstall(m);
  };
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
