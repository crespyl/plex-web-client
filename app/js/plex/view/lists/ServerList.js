define(
	[
		'plex/view/BaseView',
		'plex/view/lists/items/ServerListItem',

		// Globals
		'use!backbone'
	],

	function (BaseView, ServerListItem) {
		var ServerList = BaseView.extend({
			tagName: 'ul',
			className: 'server-list content-vertical-list',

			initialize: function () {
				this.addBinding(this.collection, 'add', this.onAdd);
				this.addBinding(this.collection, 'reset', this.onAddAll);
			},
			
			render: function () {
				this.$el.empty();

				// Keep the list populated
				this.onAddAll();

				return this;
			},

			onAdd: function (server) {
				var item = new ServerListItem({ model: server });

				// Register the view so it will be cleaned up on destroy
				this.registerView(item);

				this.$el.append(item.render().el);
			},

			onAddAll: function () {
				// Destroy any list items that have been registered already
				this.removeAllViews();

				this.collection.each(this.onAdd, this);
			}
		});

		return ServerList;
	}
);