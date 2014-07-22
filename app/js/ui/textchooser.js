

/******************
TextChooser
*******************/

var TextChooser = function(container, target, text_type) {
	// create me
	var
		isFull = false,
		showHeaders = true,
		textsHaveRendered = false,
		selectedTextInfo = null,
		textSelector = $('<div class="text-chooser nav-drop-list">' +
							'<span class="up-arrow"></span>' +
							'<span class="up-arrow-border"></span>' +
							'<div class="text-chooser-header">' +
								'<input type="text" class="text-chooser-filter-text i18n" data-i18n="[placeholder]windows.bible.filter" />' +
								'<span class="text-chooser-more-toggle i18n" data-i18n="[html]windows.bible.more"></span>' +
								'<span class="close-button">Close</span>' +
							'</div>' +
							'<div class="text-chooser-main"></div>' +
						'</div>')
						.appendTo( $('body') )
						.hide(),
		header = textSelector.find('.text-chooser-header'),
		main = textSelector.find('.text-chooser-main'),
		filter = textSelector.find('.text-chooser-filter-text'),
		title = textSelector.find('.text-chooser-title'),
		closeBtn = textSelector.find('.close-button').hide(),
		moreToggle = textSelector.find('.text-chooser-more-toggle'),
		allTextsVisible = false,
		hasTopTexts = false,
		recentlyUsedKey = 'text-recently-used',
		recentlyUsed = AppSettings.getValue(recentlyUsedKey, {"recent":[]} );

	textSelector.find('.i18n').i18n();

	title.html("Texts");

	closeBtn.on('click', hide);


	filter.on('keyup keypress', filterVersions);

	filter.on('focus', function() {
		if (Detection.hasTouch) {
			filter.blur();
		}
	});

	function filterVersions(e) {

		// when the user presses return and there is only one version, attempt to go to that one
		if (e && e.which == 13) {
			var visibleRows = main.find('.text-chooser-row:visible');

			if (visibleRows.length == 1) {

				visibleRows.click();

				filter.val('');
				return;
			}
		}


		var text = filter.val();

		if (text == '') {

			// remove all filtering
			main.find('.text-chooser-row-header, .text-chooser-row')
					.removeClass('filtered')
					.show();

			//runTopTextsSelector();
		} else {

			text = text.toLowerCase();

			// hide the headers
			main.find('.text-chooser-row-header').hide();

			main.find('.text-chooser-row').each(function() {
				var row = $(this),
					abbr = row.find('.text-chooser-abbr'),
					name = row.find('.text-chooser-name');

				if (
					row.attr('data-lang-name').toLowerCase().indexOf(text) > -1 ||
					row.attr('data-lang-name-english').toLowerCase().indexOf(text) > -1 ||
					name.text().toLowerCase().indexOf(text) > -1 ||
					abbr.text().toLowerCase().indexOf(text) > -1) {

					row.show().addClass('filtered');

				} else {

					row.hide().removeClass('filtered');

				}

			});

			// remove the recently used so there are no duplicates
			main.find('.text-chooser-recently-used').hide().addClass('filtered');


		}

	}

	// handle when user clicks on a text
	textSelector.on('click', '.text-chooser-row', function() {
		var row = $(this),
			textid = row.attr('data-id');

		row.addClass('selected')
			.siblings()
			.removeClass('selected');


		TextLoader.getText(textid, function(data) {

			selectedTextInfo = data;

			hide();

			storeRecentlyUsed(selectedTextInfo);

			updateRecentlyUsed();

			//console.log('chooser:change:click', selectedTextInfo);
			ext.trigger('change', {type:'change', target: this, data: selectedTextInfo});

		});

	});


	function storeRecentlyUsed(textInfo) {

		if (textInfo.type != 'bible') {
			return;
		}

		// look for this version
		var existingVersions = recentlyUsed.recent.filter(function(t) {
			return t.id == textInfo.id;
		});

		if (existingVersions.length == 0) {

			// store recent text
			recentlyUsed.recent.unshift(textInfo);

			// limit to 5
			while (recentlyUsed.recent.length > 5 ) {
				recentlyUsed.recent.pop();
			}
		}

		//console.log('storeRecentlyUsed',recentlyUsed.recent.length);

		// save
		AppSettings.setValue(recentlyUsedKey, recentlyUsed);
	}

	function updateRecentlyUsed() {

		if (text_type != 'bible') {
			main.find('.text-chooser-recently-used').remove();
			return;
		}


		// RECENTly Used
		//console.log('updateRecentlyUsed',recentlyUsed.recent.length);

		if (recentlyUsed.recent.length > 0) {

			var isTopText = false;

			// find if this should be a priority text shown at the beginning
			if (sofia.config.topTexts && sofia.config.topTexts.length > 0) {
				isTopText = true;
			}


			var recentlyUsedHtml =
				'<tr class="text-chooser-recently-used text-chooser-row-header ' + (isTopText ? ' is-top-text' : '') + '"><td colspan="2">' +
					i18n.t('windows.bible.recentlyused') +
				'</td></tr>';

			for (var i=0, il=recentlyUsed.recent.length; i<il; i++) {
				var textInfo = recentlyUsed.recent[i];

				recentlyUsedHtml +=
							'<tr class="text-chooser-recently-used text-chooser-row ' + (isTopText ? ' is-top-text' : '') + '" data-id="' + textInfo.id + '" data-lang-name="' + textInfo.langName + '" data-lang-name-english="' + textInfo.langNameEnglish + '">' +
								'<td class="text-chooser-abbr">' + textInfo.abbr + '</td>' +
								'<td class="text-chooser-name"><span>' + textInfo.name + '</span></td>' +
							'</tr>';


			}





			// remove existing
			main.find('.text-chooser-recently-used').remove();

			// add update recent stuff
			var recentRow = $(recentlyUsedHtml);
			main.find('table tbody').prepend(recentRow);
		}

	}

	/*
	textSelector.on('click', '.text-chooser-more', function(e) {

		var moreButton = $(this);

		if (moreButton.hasClass('show-all')) {
			allTextsVisible = false;
			moreButton.html('More');
			moreButton.removeClass('show-all');
		} else {
			allTextsVisible = true;
			moreButton.html('Less');
			moreButton.addClass('show-all');
		}

		runTopTextsSelector();

	});
	*/

	moreToggle.on('click', function() {

		// remove so that it isn't reset
		moreToggle.attr('data-i18n','');

		if (moreToggle.hasClass('show-all')) {
			allTextsVisible = false;
			moreToggle.html( i18n.t('windows.bible.more') );
			moreToggle.removeClass('show-all');
		} else {
			allTextsVisible = true;
			moreToggle.html( i18n.t('windows.bible.less')  );
			moreToggle.addClass('show-all');
		}

		runTopTextsSelector();

	});


	function runTopTextsSelector() {

		if (allTextsVisible) {
			main.find('tr').show();
		} else {
			main.find('tr:not(.is-top-text)').hide();
			main.find('.selected').show();
		}

	}

	function checkIsTopText(id) {

		var isTopText = false;

		// find if this should be a priority text shown at the beginning
		if (sofia.config.topTexts && sofia.config.topTexts.length > 0) {

			for (var t=0, tl=sofia.config.topTexts.length; t<tl; t++) {
				if (id == sofia.config.topTexts[t]) {
					isTopText = true;
					break;
				}
			}

		} else {
			isTopText = false;
		}


		return isTopText;

	}


	function renderTexts(data) {

		// render all the rows
		var html = [],
			arrayOfTexts = data;

		// turn object into array
		//for (var key in texts.Texts.textData) {
		//	arrayOfTexts.push(texts.Texts.textData[key]);
		//}

		// filter by type
		arrayOfTexts = arrayOfTexts.filter(function(t) {
			var thisTextType = typeof t.type == 'undefined' ? 'bible' : t.type;

			return thisTextType == text_type;
		});

		if (showHeaders) {
			// find languages
			var languages = [];
			for (var index in arrayOfTexts) {
				var text = arrayOfTexts[index];

				if (languages.indexOf(text.langName) == -1) {
					languages.push( text.langName );
				}
			}

			// remove pinned
			var pinnedIndex = -1;
			if (sofia.config.pinnedLanguage && sofia.config.pinnedLanguage != '') {

				var pinnedIndex = languages.indexOf(sofia.config.pinnedLanguage);
				if (pinnedIndex > -1) {
					// pull it out
					languages.splice(pinnedIndex, 1);
				}
			}

			// sort
			languages.sort();

			// put it back in
			if (pinnedIndex > -1) {
				languages.splice(0,0, sofia.config.pinnedLanguage);
			}

			for (var index in languages) {

				// get all the ones with this langu
				var langName = languages[index],
					textsInLang = arrayOfTexts.filter(function(t) { if (t.langName == langName) { return t; } }),
					hasTopText = false,
					langHtml = [];

				textsInLang = textsInLang.sort(function(a,b) {
					if (a.name == b.name) {
						return 0;
					} else if (a.name > b.name) {
						return 1;
					} else if (a.name < b.name) {
						return -1;
					}
				});


				for (var textIndex in textsInLang) {
					var text = textsInLang[textIndex],
						isTopText = checkIsTopText(text.id);


					langHtml.push('<tr class="text-chooser-row' + (isTopText ? ' is-top-text' : '') + '" data-id="' + text.id + '" data-lang-name="' + text.langName + '" data-lang-name-english="' + text.langNameEnglish + '">' +
									'<td class="text-chooser-abbr">' + text.abbr + '</td>' +
									'<td class="text-chooser-name"><span>' + text.name + '</span></td>' + // + (text.nameEnglish && text.name != text.nameEnglish ? ' (' + text.nameEnglish + ')' : '') + '</span></td>' +
								'</tr>'
					);

					if (!hasTopText && isTopText) {
						hasTopText = true;
					}
				}


				html.push('<tr class="text-chooser-row-header' + (hasTopText ? ' is-top-text' : '') + '"><td colspan="2">' +
							textsInLang[0].langName +
								( textsInLang[0].langName != textsInLang[0].langNameEnglish && typeof textsInLang[0].langNameEnglish != 'undefined' ? ' (' + textsInLang[0].langNameEnglish + ')' : '') +
							'</td></tr>'
				);
				html.push(langHtml.join(''));

			}

		} else {

			// sort by name
			arrayOfTexts.sort(function(a, b) {

				if (a.abbr > b.abbr)
					return 1;
				if (a.abbr < b.abbr)
					return -1;
				// a must be equal to b
				return 0;

			});

			for (var index in arrayOfTexts) {

				var text = arrayOfTexts[index],
						isTopText = checkIsTopText(text.id);

				html.push('<tr class="text-chooser-row' + (isTopText ? ' is-top-text' : '') + '" data-id="' + text.id + '">' +
								'<td class="text-chooser-abbr">' + text.abbr + '</td>' +
								'<td class="text-chooser-name"><span>' + text.name + '</span></td>' +
							'</tr>'
				);
			}
		}




		main.html('<table cellspacing="0">' + html.join('') + '</table>');

		updateRecentlyUsed();

		// wait just a second to adjust the size
		/*
		setTimeout(function() {
			var widthOfAbbr = main.find('td.text-chooser-abbr:first').outerWidth(true),
				widthOfArea = textSelector.width(),
				widthOfFullnames = widthOfArea - widthOfAbbr;

			console.log(widthOfAbbr, widthOfArea, widthOfFullnames);

			main.find('td.text-chooser-name span').width(widthOfFullnames);
		});
		*/


		hasTopTexts = main.find('.is-top-text').length > 0;

		if (hasTopTexts) {

			//main.append( $('<div class="text-chooser-more">More</div>'));
			textSelector.addClass('show-more');

			runTopTextsSelector();
		} else {
			allTextsVisible = true;
		}


		// find the selected text
		if (selectedTextInfo != null) {
			textSelector
					.find('[data-id="' + selectedTextInfo.id + '"]')
					.addClass('selected');
		}

		textsHaveRendered = true;

		//ext.trigger('change', {type:'change', target: this, data: selectedTextInfo});
	}

	function toggle() {

		if (textSelector.is(':visible') ) {
			hide();
		} else {
			show();
		}

	}

	function show() {
		//$('.nav-drop-list').hide();

		size();

		if (!textsHaveRendered) {
			main.html('Loading');

			TextLoader.loadTexts(function(data) {
				renderTexts(data);
				updateRecentlyUsed();
			});
		} else {
			updateRecentlyUsed();
		}

		textSelector.show();
		size();
		filter.val('');
		if (!Detection.hasTouch) {
			filter.focus();
		}
		filterVersions();

		runTopTextsSelector();

		updateRecentlyUsed();
	}

	function hide() {
		textSelector.hide();
	}

	function setTextInfo(text) {
		selectedTextInfo = text;

		storeRecentlyUsed(selectedTextInfo);
		updateRecentlyUsed();
		//node.html( selectedTextInfo.name );
	}

	function getTextInfo() {
		return selectedTextInfo;
	}

	function size(width,height) {

		if (isFull) {

			// cover the container area
			if (!(width && height)) {
				width = container.width();
				height = container.height();
			}

			textSelector
				.width(width)
				.height(height)
				.css({top: container.offset().top,left: container.offset().left});

			main
				.width(width)
				.height(height - header.outerHeight())

		} else {
			// reasonable size!
			var targetOffset = target.offset(),
				targetOuterHeight = target.outerHeight(),
				win = $(window),
				selectorWidth = textSelector.outerWidth(),

				top = targetOffset.top + targetOuterHeight + 10,
				left = targetOffset.left,
				winHeight = win.height() - 40,
				winWidth = win.width(),
				maxHeight = winHeight - top;

			if (winWidth < left + selectorWidth) {
				left = winWidth - selectorWidth;
				if (left < 0) {
					left = 0;
				}
			}


			textSelector
				.outerHeight(maxHeight)
				.css({top: top,left: left});

			main
				.outerHeight(maxHeight - header.outerHeight())


			// UP ARROW
			var upArrowLeft = targetOffset.left - left + 20;

			textSelector.find('.up-arrow, .up-arrow-border')
				.css({left: upArrowLeft});

		}
	}

	function isVisible() {
		return textSelector.is(':visible');
	}

	function node() {
		return textSelector;
	}

	function close() {
		textSelector.remove();
		ext.clearListeners();
	}

	var ext = {
		show: show,
		hide: hide,
		toggle: toggle,
		isVisible: isVisible,
		node: node,
		getTextInfo: getTextInfo,
		setTextInfo: setTextInfo,
		renderTexts: renderTexts,
		size: size,
		close: close
	};
	ext = $.extend(true, ext, EventEmitter);



	return ext;

};
