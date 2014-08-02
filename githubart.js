doOnload = function() {
  var canvasNode = document.getElementById('calendar-image');
  canvasNode.onselectstart = function () { return false; }
  cal = new CalendarImage(canvasNode.getContext('2d'));
  canvasNode.addEventListener('click', cal.clickHandler, false);
  cal.draw();
}

loadCalendar = function(username) {
  $.ajax({
    url: 'https://github.com/users/'+username+'/contributions_calendar_data',
    success: function(data) {
      document.getElementById('githubcalendar').value = data;
    },
    error: function(data) {
      console.log('failed', data);
    }
  })
};

importCalendar = function(content) {
  var json = JSON.parse(content);
  cal.max = json.map(function(item) {return item[1];}).sort(function(a,b){return b-a;})[0];
  cal.days = json.map(function(item) {
    var pval = item[1]/cal.max;
    var val = cal.levels.indexOf(cal.levels.filter(function(d) {return pval < d;})[0]);
    item.push(val);
    return item;
  })

  cal.draw();
}

calendarToGitCommands = function() {
  return cal.days
    .filter(function(d) {return d[2] > 0})
    .map(function(d) {
      var out = "";
      for (var i =0; i < d[2]; i++) {
        out += ((i>0)?";":"")+"git commit --allow-empty -m \"bugfix\" --date "+printDate(d[0]);
      }
      return out;
  }).join(";");
}

function printDate(temp) {
  return temp.getFullYear() +"-" + padStr(1 + temp.getMonth()) +"-" + padStr(temp.getDate())
    +"T"+padStr(temp.getHours())+":"+padStr(temp.getMinutes())+":"+padStr(temp.getSeconds());
}
function padStr(i) {
    return (i < 10) ? "0" + i : "" + i;
}

CalendarImage = function(ctx) {
  var today = new Date();
  var SunStartsWeek = 1;
  this.levels = [0.001, 0.24, 0.45, 0.75, 1];
  this.startingWeekDay = (today.getDay() - SunStartsWeek) % 7;
  this.ctx = ctx;
  this.days = [];
  this.max = 4;
  for (var i = 0; i < 366; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - 366 + i + 1)
    this.days[i] = [d, 0, 0];
  }
  var self = this;

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
    x -= event.srcElement.offsetLeft;
    y -= event.srcElement.offsetTop;
    var day = self.day(x, y);
    if ((day < 0) || (day >= self.days.length)) {
      return;
    }
    self.days[day][2] = (self.days[day][2] + 1) % 5;
    self.draw();
  }
}

CalendarImage.prototype.draw = function() {
  var ctx = this.ctx;
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
}

CalendarImage.prototype.position = function(day) {
  day += this.startingWeekDay;
  var x = 33 + Math.floor(day/7)*13;
  var y = 10 + (day%7)*13;
  return [x,y];
}

CalendarImage.prototype.day = function(x, y) {
  var week = Math.floor((x - 33)/13);
  var day = Math.floor((y - 10)/13);
  return week*7 + day - this.startingWeekDay;
}
