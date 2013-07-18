define(["jquery","mockup-patterns-base","mockup-patterns-backdrop"],function(a,b,c){"use strict";var d=b.extend({name:"expose",defaults:{triggers:"focusin",klassActive:"active",backdrop:"body",backdropZIndex:"1000",backdropOpacity:"0.8",backdropKlass:"backdrop",backdropKlassActive:"backdrop-active",backdropCloseOnEsc:!0,backdropCloseOnClick:!0},init:function(){var b=this;b.backdrop=new c(b.$el.parents(b.options.backdrop),{zindex:b.options.backdropZIndex,klass:b.options.backdropKlass,klassActive:b.options.backdropKlassActive,styles:b.options.backdropStyles,opacity:b.options.backdropOpacity,closeOnEsc:b.options.backdropCloseOnEsc,closeOnClick:b.options.backdropCloseOnClick}),b.options.triggers&&a.each(b.options.triggers.split(","),function(c,d){d=d.split(" "),a(d[1]||b.$el).on(d[0],function(){b.show()})}),b.backdrop.on("hidden",function(){b.hide()})},show:function(){var a=this;a.$el.hasClass(a.options.klassActive)||(a.trigger("show"),a.$el.addClass(a.options.klassActive),a.backdrop.show(),a._initialZIndex=a.$el.css("z-index"),a.$el.css("z-index",a.options.backdropZIndex+1),a.$el.css("opacity","0"),a.$el.animate({opacity:"1"},500),a.trigger("shown"))},hide:function(){var a=this;a.$el.hasClass(a.options.klassActive)&&(a.trigger("hide"),a.backdrop.hide(),a.$el.css("z-index",a._initialZIndex),a.$el.removeClass(a.options.klassActive),a.trigger("hidden"))}});return d});