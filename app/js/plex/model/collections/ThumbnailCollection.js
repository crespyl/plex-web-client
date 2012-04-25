define(
	[
		'plex/model/ThumbnailModel',

		// Globals
		'use!backbone',
		'use!xml2json'
	],

	function (ThumbnailModel) {
		var SectionCollection = Backbone.Collection.extend({
			model: ThumbnailModel,
			url: 'pms/system/library/sections',

			sync: function (method, model, options) {
				options.myPlex = true;

				Backbone.sync(method, model, options);
			},

			parse: function (response) {
				var sections = $.xml2json(response).Directory;
				var i = sections.length - 1;
				var thumbnails = sections[i].Thumb;

				while(i--) {
					thumbnails = _.union(thumbnails, sections[i].Thumb);
				}

				return thumbnails;
			}
		});

		return SectionCollection;
	}
);