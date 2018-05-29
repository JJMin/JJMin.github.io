$(document).ready(function () {
	/*==================================
	=            SCROLL FOR BUTTON AND ARROW           =
	==================================*/
	$('.js--scroll-to-about-us').click(function () {
		$('html, body').animate({
			scrollTop: $('.js--about-us').offset().top - 50
		}, 1000);
	});

	$('#device').css('height', '250px');

	/*=================================
	=            SCROLL FOR NAV BUTTONS            =
	=================================*/
	$(function () {
		$('a[href*="#"]:not([href="#"])').click(function () {
			if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
				var target = $(this.hash);
				target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
				if (target.length) {
					$('html, body').animate({
						scrollTop: target.offset().top - 50
					}, 1000);
					return false;
				}
			}
		});
	});

	$('#device').css('height', '0px');

	/*=================================
	=            SLIDESHOW            =
	=================================*/
	$("#pikame").PikaChoose();

	/*===============================
	=            COUNTER            =
	===============================*/
	$('.count').each(function () {
		$(this).prop('Counter', 0).animate({
			Counter: $(this).text()
		}, {
			duration: 50000,
			easing: 'swing',
			step: function (now) {
				$(this).text(Math.ceil(now));
			}
		});
	});


	/*================================
	=            TIMELINE            =
	================================*/
	var timelines = $('.cd-horizontal-timeline'),
		eventsMinDistance = 60;

	(timelines.length > 0) && initTimeline(timelines);

	function initTimeline(timelines) {
		timelines.each(function () {
			var timeline = $(this),
				timelineComponents = {};
			//cache timeline components
			timelineComponents['timelineWrapper'] = timeline.find('.events-wrapper');
			timelineComponents['eventsWrapper'] = timelineComponents['timelineWrapper'].children('.events');
			timelineComponents['fillingLine'] = timelineComponents['eventsWrapper'].children('.filling-line');
			timelineComponents['timelineEvents'] = timelineComponents['eventsWrapper'].find('a');
			timelineComponents['timelineDates'] = parseDate(timelineComponents['timelineEvents']);
			timelineComponents['eventsMinLapse'] = minLapse(timelineComponents['timelineDates']);
			timelineComponents['timelineNavigation'] = timeline.find('.cd-timeline-navigation');
			timelineComponents['eventsContent'] = timeline.children('.events-content');

			//assign a left postion to the single events along the timeline
			setDatePosition(timelineComponents, eventsMinDistance);
			//assign a width to the timeline
			var timelineTotWidth = setTimelineWidth(timelineComponents, eventsMinDistance);
			//the timeline has been initialize - show it
			timeline.addClass('loaded');

			//detect click on the next arrow
			timelineComponents['timelineNavigation'].on('click', '.next', function (event) {
				event.preventDefault();
				updateSlide(timelineComponents, timelineTotWidth, 'next');
			});
			//detect click on the prev arrow
			timelineComponents['timelineNavigation'].on('click', '.prev', function (event) {
				event.preventDefault();
				updateSlide(timelineComponents, timelineTotWidth, 'prev');
			});
			//detect click on the a single event - show new event content
			timelineComponents['eventsWrapper'].on('click', 'a', function (event) {
				event.preventDefault();
				timelineComponents['timelineEvents'].removeClass('selected');
				$(this).addClass('selected');
				updateOlderEvents($(this));
				updateFilling($(this), timelineComponents['fillingLine'], timelineTotWidth);
				updateVisibleContent($(this), timelineComponents['eventsContent']);
			});

			//on swipe, show next/prev event content
			timelineComponents['eventsContent'].on('swipeleft', function () {
				var mq = checkMQ();
				(mq == 'mobile') && showNewContent(timelineComponents, timelineTotWidth, 'next');
			});
			timelineComponents['eventsContent'].on('swiperight', function () {
				var mq = checkMQ();
				(mq == 'mobile') && showNewContent(timelineComponents, timelineTotWidth, 'prev');
			});

			//keyboard navigation
			$(document).keyup(function (event) {
				if (event.which == '37' && elementInViewport(timeline.get(0))) {
					showNewContent(timelineComponents, timelineTotWidth, 'prev');
				} else if (event.which == '39' && elementInViewport(timeline.get(0))) {
					showNewContent(timelineComponents, timelineTotWidth, 'next');
				}
			});
		});
	}

	function updateSlide(timelineComponents, timelineTotWidth, string) {
		//retrieve translateX value of timelineComponents['eventsWrapper']
		var translateValue = getTranslateValue(timelineComponents['eventsWrapper']),
			wrapperWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', ''));
		//translate the timeline to the left('next')/right('prev')
		(string == 'next') ?
		translateTimeline(timelineComponents, translateValue - wrapperWidth + eventsMinDistance, wrapperWidth - timelineTotWidth): translateTimeline(timelineComponents, translateValue + wrapperWidth - eventsMinDistance);
	}

	function showNewContent(timelineComponents, timelineTotWidth, string) {
		//go from one event to the next/previous one
		var visibleContent = timelineComponents['eventsContent'].find('.selected'),
			newContent = (string == 'next') ? visibleContent.next() : visibleContent.prev();

		if (newContent.length > 0) { //if there's a next/prev event - show it
			var selectedDate = timelineComponents['eventsWrapper'].find('.selected'),
				newEvent = (string == 'next') ? selectedDate.parent('li').next('li').children('a') : selectedDate.parent('li').prev('li').children('a');

			updateFilling(newEvent, timelineComponents['fillingLine'], timelineTotWidth);
			updateVisibleContent(newEvent, timelineComponents['eventsContent']);
			newEvent.addClass('selected');
			selectedDate.removeClass('selected');
			updateOlderEvents(newEvent);
			updateTimelinePosition(string, newEvent, timelineComponents);
		}
	}

	function updateTimelinePosition(string, event, timelineComponents) {
		//translate timeline to the left/right according to the position of the selected event
		var eventStyle = window.getComputedStyle(event.get(0), null),
			eventLeft = Number(eventStyle.getPropertyValue("left").replace('px', '')),
			timelineWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', '')),
			timelineTotWidth = Number(timelineComponents['eventsWrapper'].css('width').replace('px', ''));
		var timelineTranslate = getTranslateValue(timelineComponents['eventsWrapper']);

		if ((string == 'next' && eventLeft > timelineWidth - timelineTranslate) || (string == 'prev' && eventLeft < -timelineTranslate)) {
			translateTimeline(timelineComponents, -eventLeft + timelineWidth / 2, timelineWidth - timelineTotWidth);
		}
	}

	function translateTimeline(timelineComponents, value, totWidth) {
		var eventsWrapper = timelineComponents['eventsWrapper'].get(0);
		value = (value > 0) ? 0 : value; //only negative translate value
		value = (!(typeof totWidth === 'undefined') && value < totWidth) ? totWidth : value; //do not translate more than timeline width
		setTransformValue(eventsWrapper, 'translateX', value + 'px');
		//update navigation arrows visibility
		(value == 0) ? timelineComponents['timelineNavigation'].find('.prev').addClass('inactive'): timelineComponents['timelineNavigation'].find('.prev').removeClass('inactive');
		(value == totWidth) ? timelineComponents['timelineNavigation'].find('.next').addClass('inactive'): timelineComponents['timelineNavigation'].find('.next').removeClass('inactive');
	}

	function updateFilling(selectedEvent, filling, totWidth) {
		//change .filling-line length according to the selected event
		var eventStyle = window.getComputedStyle(selectedEvent.get(0), null),
			eventLeft = eventStyle.getPropertyValue("left"),
			eventWidth = eventStyle.getPropertyValue("width");
		eventLeft = Number(eventLeft.replace('px', '')) + Number(eventWidth.replace('px', '')) / 2;
		var scaleValue = eventLeft / totWidth;
		setTransformValue(filling.get(0), 'scaleX', scaleValue);
	}

	function setDatePosition(timelineComponents, min) {
		for (i = 0; i < timelineComponents['timelineDates'].length; i++) {
			var distance = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][i]),
				distanceNorm = Math.round(distance / timelineComponents['eventsMinLapse']) + 2;
			timelineComponents['timelineEvents'].eq(i).css('left', distanceNorm * min + 'px');
		}
	}

	function setTimelineWidth(timelineComponents, width) {
		var timeSpan = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][timelineComponents['timelineDates'].length - 1]),
			timeSpanNorm = timeSpan / timelineComponents['eventsMinLapse'],
			timeSpanNorm = Math.round(timeSpanNorm) + 4,
			totalWidth = timeSpanNorm * width;
		timelineComponents['eventsWrapper'].css('width', totalWidth + 'px');
		updateFilling(timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents['fillingLine'], totalWidth);
		updateTimelinePosition('next', timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents);

		return totalWidth;
	}

	function updateVisibleContent(event, eventsContent) {
		var eventDate = event.data('date'),
			visibleContent = eventsContent.find('.selected'),
			selectedContent = eventsContent.find('[data-date="' + eventDate + '"]'),
			selectedContentHeight = selectedContent.height();

		if (selectedContent.index() > visibleContent.index()) {
			var classEnetering = 'selected enter-right',
				classLeaving = 'leave-left';
		} else {
			var classEnetering = 'selected enter-left',
				classLeaving = 'leave-right';
		}

		selectedContent.attr('class', classEnetering);
		visibleContent.attr('class', classLeaving).one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function () {
			visibleContent.removeClass('leave-right leave-left');
			selectedContent.removeClass('enter-left enter-right');
		});
		eventsContent.css('height', selectedContentHeight + 'px');
	}

	function updateOlderEvents(event) {
		event.parent('li').prevAll('li').children('a').addClass('older-event').end().end().nextAll('li').children('a').removeClass('older-event');
	}

	function getTranslateValue(timeline) {
		var timelineStyle = window.getComputedStyle(timeline.get(0), null),
			timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
			timelineStyle.getPropertyValue("-moz-transform") ||
			timelineStyle.getPropertyValue("-ms-transform") ||
			timelineStyle.getPropertyValue("-o-transform") ||
			timelineStyle.getPropertyValue("transform");

		if (timelineTranslate.indexOf('(') >= 0) {
			var timelineTranslate = timelineTranslate.split('(')[1];
			timelineTranslate = timelineTranslate.split(')')[0];
			timelineTranslate = timelineTranslate.split(',');
			var translateValue = timelineTranslate[4];
		} else {
			var translateValue = 0;
		}

		return Number(translateValue);
	}

	function setTransformValue(element, property, value) {
		element.style["-webkit-transform"] = property + "(" + value + ")";
		element.style["-moz-transform"] = property + "(" + value + ")";
		element.style["-ms-transform"] = property + "(" + value + ")";
		element.style["-o-transform"] = property + "(" + value + ")";
		element.style["transform"] = property + "(" + value + ")";
	}

	//based on http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-javascript
	function parseDate(events) {
		var dateArrays = [];
		events.each(function () {
			var singleDate = $(this),
				dateComp = singleDate.data('date').split('T');
			if (dateComp.length > 1) { //both DD/MM/YEAR and time are provided
				var dayComp = dateComp[0].split('/'),
					timeComp = dateComp[1].split(':');
			} else if (dateComp[0].indexOf(':') >= 0) { //only time is provide
				var dayComp = ["2000", "0", "0"],
					timeComp = dateComp[0].split(':');
			} else { //only DD/MM/YEAR
				var dayComp = dateComp[0].split('/'),
					timeComp = ["0", "0"];
			}
			var newDate = new Date(dayComp[2], dayComp[1] - 1, dayComp[0], timeComp[0], timeComp[1]);
			dateArrays.push(newDate);
		});
		return dateArrays;
	}

	function daydiff(first, second) {
		return Math.round((second - first));
	}

	function minLapse(dates) {
		//determine the minimum distance among events
		var dateDistances = [];
		for (i = 1; i < dates.length; i++) {
			var distance = daydiff(dates[i - 1], dates[i]);
			dateDistances.push(distance);
		}
		return Math.min.apply(null, dateDistances);
	}

	/*
		How to tell if a DOM element is visible in the current viewport?
		http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
	*/
	function elementInViewport(el) {
		var top = el.offsetTop;
		var left = el.offsetLeft;
		var width = el.offsetWidth;
		var height = el.offsetHeight;

		while (el.offsetParent) {
			el = el.offsetParent;
			top += el.offsetTop;
			left += el.offsetLeft;
		}

		return (
			top < (window.pageYOffset + window.innerHeight) &&
			left < (window.pageXOffset + window.innerWidth) &&
			(top + height) > window.pageYOffset &&
			(left + width) > window.pageXOffset
		);
	}

	function checkMQ() {
		//check if mobile or desktop device
		return window.getComputedStyle(document.querySelector('.cd-horizontal-timeline'), '::before').getPropertyValue('content').replace(/'/g, "").replace(/"/g, "");
	}


	/*============================
	=            TEAM            =
	============================*/
	var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;

	//open team-member bio
	$('#cd-team').find('ul a').on('click', function (event) {
		event.preventDefault();
		var selected_member = $(this).data('type');
		$('.cd-member-bio.' + selected_member + '').addClass('slide-in');
		$('.cd-member-bio-close').addClass('is-visible');

		// firefox transitions break when parent overflow is changed, so we need to wait for the end of the trasition to give the body an overflow hidden
		if (is_firefox) {
			$('main').addClass('slide-out').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
				$('body').addClass('overflow-hidden');
			});
		} else {
			$('main').addClass('slide-out');
			$('body').addClass('overflow-hidden');
		}

	});

	//close team-member bio
	$(document).on('click', '.cd-overlay, .cd-member-bio-close', function (event) {
		event.preventDefault();
		$('.cd-member-bio').removeClass('slide-in');
		$('.cd-member-bio-close').removeClass('is-visible');

		if (is_firefox) {
			$('main').removeClass('slide-out').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
				$('body').removeClass('overflow-hidden');
			});
		} else {
			$('main').removeClass('slide-out');
			$('body').removeClass('overflow-hidden');
		}
	});

	/*==================================
	=            GOOGLE MAP            =
	==================================*/
	var map = new GMaps({
		div: '.map',
		lat: 45.503769,
		lng: -73.578174,
		zoom: 14
	});

	if (map.map) {
		// Disabling mouse wheel scroll zooming
		map.map.setOptions({
			scrollwheel: false
		});
	}

	map.addMarker({
		lat: 45.503769,
		lng: -73.578174,
		title: 'Lima',
		click: function (e) {
			alert('This is MCSS Headquarters! Visit Us! :-)');
		}
	});

	/*==================================
	=            Type            =
	==================================*/
	var TxtType = function (el, toRotate, period) {
		this.toRotate = toRotate;
		this.el = el;
		this.loopNum = 0;
		this.period = parseInt(period, 10) || 2000;
		this.txt = '';
		this.tick();
		this.isDeleting = false;
	};

	TxtType.prototype.tick = function () {
		var i = this.loopNum % this.toRotate.length;
		var fullTxt = this.toRotate[i];

		if (this.isDeleting) {
			this.txt = fullTxt.substring(0, this.txt.length - 1);
		} else {
			this.txt = fullTxt.substring(0, this.txt.length + 1);
		}

		this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

		var that = this;
		var delta = 214 - Math.random() * 100;

		if (this.isDeleting) {
			delta /= 2;
		}

		if (!this.isDeleting && this.txt === fullTxt) {
			delta = this.period;
			this.isDeleting = true;
		} else if (this.isDeleting && this.txt === '') {
			this.isDeleting = false;
			this.loopNum++;
			delta = 500;
		}

		setTimeout(function () {
			that.tick();
		}, delta);
	};

	window.onload = function () {
		var elements = document.getElementsByClassName('typewrite');
		for (var i = 0; i < elements.length; i++) {
			var toRotate = elements[i].getAttribute('data-type');
			var period = elements[i].getAttribute('data-period');
			if (toRotate) {
				new TxtType(elements[i], JSON.parse(toRotate), period);
			}
		}
		// INJECT CSS
		var css = document.createElement("style");
		css.type = "text/css";
		css.innerHTML = ".typewrite > .wrap { border-right: 0.04em solid #fff hidden}";
		document.body.appendChild(css);
	};

	/*==================================
	=            ANIMATIONS ON SCROLL            =
	==================================*/
	/*----------  Home  ----------*/
	$('.js--wp-1').waypoint(function (direction) {
		$('.js--wp-1').addClass('animated fadeInDown');
	}, {
		offset: '80%'
	});

	$('.js--wp-2').waypoint(function (direction) {
		$('.js--wp-2').addClass('animated fadeInLeft');
	}, {
		offset: '80%'
	});

	$('.js--wp-3').waypoint(function (direction) {
		$('.js--wp-3').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-4').waypoint(function (direction) {
		$('.js--wp-4').addClass('animated fadeInDown');
	}, {
		offset: '100%'
	});


	/*----------  About  ----------*/
	$('.js--wp-5').waypoint(function (direction) {
		$('.js--wp-5').addClass('animated fadeInDown');
	}, {
		offset: '70%'
	});

	$('.js--wp-6').waypoint(function (direction) {
		$('.js--wp-6').addClass('animated rollIn');
	}, {
		offset: '70%'
	});

	$('.js--wp-7').waypoint(function (direction) {
		$('.js--wp-7').addClass('animated fadeInUp');
	}, {
		offset: '70%'
	});

	$('.js--wp-8').waypoint(function (direction) {
		$('.js--wp-8').addClass('animated fadeIn');
	}, {
		offset: '70%'
	});

	/*----------  Stats  ----------*/
	$('.js--wp-9').waypoint(function (direction) {
		$('.js--wp-9').addClass('animated fadeInLeft');
	}, {
		offset: '84%'
	});

	$('.js--wp-10').waypoint(function (direction) {
		$('.js--wp-10').addClass('animated fadeInLeft');
	}, {
		offset: '84%'
	});

	$('.js--wp-11').waypoint(function (direction) {
		$('.js--wp-11').addClass('animated fadeInRight');
	}, {
		offset: '84%'
	});

	$('.js--wp-12').waypoint(function (direction) {
		$('.js--wp-12').addClass('animated fadeInRight');
	}, {
		offset: '84%'
	});

	/*----------  Events  ----------*/
	$('.js--wp-13').waypoint(function (direction) {
		$('.js--wp-13').addClass('animated fadeInUp');
	}, {
		offset: '85%'
	});

	$('.js--wp-85').waypoint(function (direction) {
		$('.js--wp-85').addClass('animated fadeInUp');
	}, {
		offset: '85%'
	});

	$('.js--wp-86').waypoint(function (direction) {
		$('.js--wp-86').addClass('animated fadeInUp');
	}, {
		offset: '85%'
	});

	$('.js--wp-88').waypoint(function (direction) {
		$('.js--wp-88').addClass('animated fadeInUp');
	}, {
		offset: '100%'
	});


	/*----------  Team Join Small Section  ----------*/
	$('.js--wp-14').waypoint(function (direction) {
		$('.js--wp-14').addClass('animated bounceInLeft');
	}, {
		offset: '85%'
	});

	$('.js--wp-15').waypoint(function (direction) {
		$('.js--wp-15').addClass('animated bounceInRight');
	}, {
		offset: '85%'
	});


	/*----------  Our Team  ----------*/
	$('.js--wp-16').waypoint(function (direction) {
		$('.js--wp-16').addClass('animated fadeInUp');
	}, {
		offset: '84%'
	});

	$('.js--wp-17').waypoint(function (direction) {
		$('.js--wp-17').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-18').waypoint(function (direction) {
		$('.js--wp-18').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-19').waypoint(function (direction) {
		$('.js--wp-19').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-20').waypoint(function (direction) {
		$('.js--wp-20').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-21').waypoint(function (direction) {
		$('.js--wp-21').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-22').waypoint(function (direction) {
		$('.js--wp-22').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-23').waypoint(function (direction) {
		$('.js--wp-23').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-79').waypoint(function (direction) {
		$('.js--wp-79').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-24').waypoint(function (direction) {
		$('.js--wp-24').addClass('animated flipInX')
	}, {
		offset: '80%'
	});

	$('.js--wp-25').waypoint(function (direction) {
		$('.js--wp-25').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-26').waypoint(function (direction) {
		$('.js--wp-26').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-27').waypoint(function (direction) {
		$('.js--wp-27').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-28').waypoint(function (direction) {
		$('.js--wp-28').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-29').waypoint(function (direction) {
		$('.js--wp-29').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-53').waypoint(function (direction) {
		$('.js--wp-53').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-30').waypoint(function (direction) {
		$('.js--wp-30').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-31').waypoint(function (direction) {
		$('.js--wp-31').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-32').waypoint(function (direction) {
		$('.js--wp-32').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-33').waypoint(function (direction) {
		$('.js--wp-33').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-80').waypoint(function (direction) {
		$('.js--wp-80').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-34').waypoint(function (direction) {
		$('.js--wp-34').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-35').waypoint(function (direction) {
		$('.js--wp-35').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-81').waypoint(function (direction) {
		$('.js--wp-81').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-82').waypoint(function (direction) {
		$('.js--wp-82').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-83').waypoint(function (direction) {
		$('.js--wp-83').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-84').waypoint(function (direction) {
		$('.js--wp-84').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-36').waypoint(function (direction) {
		$('.js--wp-36').addClass('animated flipInX');
	}, {
		offset: '80%'
	});
	$('.js--wp-87').waypoint(function (direction) {
		$('.js--wp-87').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	/*----------  Our Sponsors  ----------*/
	$('.js--wp-37').waypoint(function (direction) {
		$('.js--wp-37').addClass('animated fadeInDown');
	}, {
		offset: '80%'
	});

	$('.js--wp-38').waypoint(function (direction) {
		$('.js--wp-38').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-39').waypoint(function (direction) {
		$('.js--wp-39').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-40').waypoint(function (direction) {
		$('.js--wp-40').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-41').waypoint(function (direction) {
		$('.js--wp-41').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-42').waypoint(function (direction) {
		$('.js--wp-42').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-43').waypoint(function (direction) {
		$('.js--wp-43').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-54').waypoint(function (direction) {
		$('.js--wp-54').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-55').waypoint(function (direction) {
		$('.js--wp-55').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-56').waypoint(function (direction) {
		$('.js--wp-56').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-57').waypoint(function (direction) {
		$('.js--wp-57').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-58').waypoint(function (direction) {
		$('.js--wp-58').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-59').waypoint(function (direction) {
		$('.js--wp-59').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-60').waypoint(function (direction) {
		$('.js--wp-60').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-61').waypoint(function (direction) {
		$('.js--wp-61').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-62').waypoint(function (direction) {
		$('.js--wp-62').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-63').waypoint(function (direction) {
		$('.js--wp-63').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-64').waypoint(function (direction) {
		$('.js--wp-64').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-65').waypoint(function (direction) {
		$('.js--wp-65').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-66').waypoint(function (direction) {
		$('.js--wp-66').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-67').waypoint(function (direction) {
		$('.js--wp-67').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-68').waypoint(function (direction) {
		$('.js--wp-68').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-69').waypoint(function (direction) {
		$('.js--wp-69').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-70').waypoint(function (direction) {
		$('.js--wp-70').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-71').waypoint(function (direction) {
		$('.js--wp-71').addClass('animated flipInX');
	}, {
		offset: '80%'
	});
	$('.js--wp-72').waypoint(function (direction) {
		$('.js--wp-72').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-73').waypoint(function (direction) {
		$('.js--wp-73').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-74').waypoint(function (direction) {
		$('.js--wp-74').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-75').waypoint(function (direction) {
		$('.js--wp-75').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-76').waypoint(function (direction) {
		$('.js--wp-76').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-77').waypoint(function (direction) {
		$('.js--wp-77').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-78').waypoint(function (direction) {
		$('.js--wp-78').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-89').waypoint(function (direction) {
		$('.js--wp-89').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-90').waypoint(function (direction) {
		$('.js--wp-90').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-91').waypoint(function (direction) {
		$('.js--wp-91').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-92').waypoint(function (direction) {
		$('.js--wp-92').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-94').waypoint(function (direction) {
		$('.js--wp-94').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-96').waypoint(function (direction) {
		$('.js--wp-96').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-97').waypoint(function (direction) {
		$('.js--wp-97').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-98').waypoint(function (direction) {
		$('.js--wp-98').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-99').waypoint(function (direction) {
		$('.js--wp-99').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-100').waypoint(function (direction) {
		$('.js--wp-100').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-101').waypoint(function (direction) {
		$('.js--wp-101').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	$('.js--wp-102').waypoint(function (direction) {
		$('.js--wp-102').addClass('animated flipInX');
	}, {
		offset: '80%'
	});

	/*----------  Contact  ----------*/
	$('.js--wp-44').waypoint(function (direction) {
		$('.js--wp-44').addClass('animated fadeInDown');
	}, {
		offset: '80%'
	});

	$('.js--wp-45').waypoint(function (direction) {
		$('.js--wp-45').addClass('animated bounceInLeft');
	}, {
		offset: '80%'
	});

	$('.js--wp-46').waypoint(function (direction) {
		$('.js--wp-46').addClass('animated bounceInDown');
	}, {
		offset: '80%'
	});

	$('.js--wp-47').waypoint(function (direction) {
		$('.js--wp-47').addClass('animated bounceInDown');
	}, {
		offset: '80%'
	});

	$('.js--wp-48').waypoint(function (direction) {
		$('.js--wp-48').addClass('animated bounceInRight');
	}, {
		offset: '80%'
	});

	$('.js--wp-49').waypoint(function (direction) {
		$('.js--wp-49').addClass('animated bounceInLeft');
	}, {
		offset: '80%'
	});

	$('.js--wp-50').waypoint(function (direction) {
		$('.js--wp-50').addClass('animated bounceInRight');
	}, {
		offset: '80%'
	});

	/*----------  Footer  ----------*/
	$('.js--wp-51').waypoint(function (direction) {
		$('.js--wp-51').addClass('animated flipInX');
	}, {
		offset: '99%'
	});

	$('.js--wp-52').waypoint(function (direction) {
		$('.js--wp-52').addClass('animated fadeIn');
	}, {
		offset: '99%'
	});
});

/*----------  Arrow Page  ----------*/
jQuery(document).ready(function ($) {
	// browser window scroll (in pixels) after which the "back to top" link is shown
	var offset = 300,
		//browser window scroll (in pixels) after which the "back to top" link opacity is reduced
		offset_opacity = 1200,
		//duration of the top scrolling animation (in ms)
		scroll_top_duration = 700,
		//grab the "back to top" link
		$back_to_top = $('.cd-top');

	//hide or show the "back to top" link
	$(window).scroll(function () {
		($(this).scrollTop() > offset) ? $back_to_top.addClass('cd-is-visible'): $back_to_top.removeClass('cd-is-visible cd-fade-out');
		if ($(this).scrollTop() > offset_opacity) {
			$back_to_top.addClass('cd-fade-out');
		}
	});

	//smooth scroll to top
	$back_to_top.on('click', function (event) {
		event.preventDefault();
		$('body,html').animate({
			scrollTop: 0,
		}, scroll_top_duration);
	});

});

/*------------- Arrow Scroll Hide --------------*/
$(window).scroll(function () {
	var top = ($(window).scrollTop()) * 5;
	var height = $(window).height();
	var position = top / height;
	position = 1 - position;
	$('.arrow').css('opacity', position);
});