
calendarToGitCommands = function(cal) {
  var printDate = function(temp) {
    return temp.getFullYear() +"-" + padStr(1 + temp.getMonth()) +"-" + padStr(temp.getDate());
  };
  var padStr = function(i) {
      return (i < 10) ? "0" + i : "" + i;
  };

  var prefix = "#!/bin/bash\nH=T13:30:51\nG='git commit --allow-empty -m \"bugfix\" --date'\n";
  var result = cal.days
    .filter(function(d) {return d[2] > 0})
    .map(function(d) {
      var out = "";
      for (var i =0; i < d[2]; i++) {
        out += ((i>0)?";":"")+"$G "+printDate(d[0])+"$H";
      }
      return out;
  }).join(";\n");

  return result ? prefix+result : "";
};

CalendarImage = function(ctx) {
  var self = this;
  this.today = new Date();
  var SunStartsWeek = 1;
  this.levels = [0.001, 0.24, 0.45, 0.75, 1];
  this.scale = 0.7;
  this.startingWeekDay = (this.today.getDay() - SunStartsWeek) % 7;
  this.ctx = ctx;
  this.days = [];

  this.clickHandler = function(e) {
    var x;
    var y;
    if (e.pageX || e.pageY) {
      x = e.pageX;
      y = e.pageY;
    }
    else {
      x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    var target = e.target || e.srcElement;
    x -= target.offsetLeft;
    y -= target.offsetTop;
    var day = self.day(x, y);
    if (!day) {
      return;
    }
    self.days[day][2] = (self.days[day][2] + 1) % 5;
    self.draw();
    self.changed && self.changed();
  }
};

CalendarImage.prototype.open = function(t) {
  var days = [];
  for (var i = 0; i < 366; i++) {
    var d = new Date(this.today);
    d.setDate(d.getDate() - 366 + i + 1)
    days[i] = [d, 0, i < 7-this.startingWeekDay ? 0 : t[i-7+this.startingWeekDay]];
  }
  this.max = 4;
  this.days = days;
  this.draw();
  self.changed && self.changed();
};

CalendarImage.prototype.fromGitHub = function(content) {
  var self = this;
  var json = JSON.parse(content);
  self.max = json.map(function(item) {return item[1];}).sort(function(a,b){return b-a;})[0];
  self.days = json.map(function(item) {
    var pval = item[1]/self.max;
    var val = self.levels.indexOf(self.levels.filter(function(d) {return pval < d;})[0]);
    item.push(val);
    return item;
  });

  self.draw();
  self.changed && self.changed();
};

CalendarImage.prototype.toTemplate = function() {
  var out = this.days.map(function(item) {return item[2]});
  out.splice(0, 7-this.startingWeekDay);
  console.log(out.join(','));
};

CalendarImage.prototype.draw = function() {
  var ctx = this.ctx;
  ctx.save();
  ctx.clearRect(0,0,52*13,7*13);
  ctx.scale(this.scale, this.scale);
  var styles = [
    "rgb(238, 238, 238)",
    "rgb(214, 230, 133)",
    "rgb(140, 198, 101)",
    "rgb(68, 163, 64)",
    "rgb(30, 104, 35)"
  ];

  ctx.fillStyle = styles[0];
  for (var d = 0; d < this.days.length; d++) {
    ctx.fillStyle = styles[this.days[d][2]];
    var coords =  this.position(d);
    ctx.fillRect(coords[0], coords[1], 11, 11);
  }
  ctx.restore();
};

CalendarImage.prototype.position = function(day) {
  day += this.startingWeekDay;
  var x = 3 + Math.floor(day/7)*13;
  var y = 3 + (day%7)*13;
  return [x,y];
};

CalendarImage.prototype.day = function(x, y) {
  var scale = 1/this.scale;
  var week = Math.floor((x - 150)/(13*this.scale));
  var day = Math.floor((y - 8)/(13*this.scale));
  var result = week*7 + day - this.startingWeekDay;
  return (day >= 0) && (day < this.days.length) ? result : undefined;
};
