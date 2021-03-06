// tests for Base
//
// @author Rok Garbas
// @version 1.0
// @licstart  The following is the entire license notice for the JavaScript
//            code in this page.
//
// Copyright (C) 2010 Plone Foundation
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//
// @licend  The above is the entire license notice for the JavaScript code in
//          this page.
//

define([
  'chai',
  'jquery',
  'sinon',
  'mockup-registry',
  'tinymce',
  'mockup-patterns-tinymce'
], function(chai, $, sinon, registry, tinymce, TinyMCE) {
  "use strict";

  var expect = chai.expect,
      mocha = window.mocha;

  mocha.setup('bdd');
  $.fx.off = true;

  var createTinymce = function(options){
    if(options === undefined){
      options = {};
    }
    var $el = $(
      '<textarea class="pat-tinymce">' +
      '</textarea>').appendTo('body');

    return new TinyMCE($el, options);
  };

  describe("TinyMCE", function() {
    afterEach(function(){
      $('body').empty();
    });

    beforeEach(function(){
      this.server = sinon.fakeServer.create();
      this.server.autoRespond = true;

      this.server.respondWith("GET", /data.json/, function (xhr, id) {
        var items = [
          {
            "UID": "123sdfasdf",
            "getURL": "http://localhost:8081/news/aggregator",
            "path": '/news/aggregator',
            "Type": "Collection", "Description": "Site News",
            "Title": "News"
          },
          {
            "UID": "fooasdfasdf1123asZ",
            'path': '/about',
            "getURL": "http://localhost:8081/about",
            "Type": "Page", "Description": "About",
            "Title": "About"
          },
        ];

        if(xhr.url.indexOf('123sdfasdf') !== -1){
          // ajax request for this one val
          items.pop();
        }
        xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify({
          total: items.length,
          results: items
        }));
      });
    });

    it('creates tinymce', function(){
      var $el = $(
       '<div>' +
       '  <textarea class="pat-tinymce">' +
       '  </textarea>' +
       '</div>').appendTo('body');
      registry.scan($el);
      expect($el.children().length).to.be.gt(1);
      tinymce.get(0).remove();
    });

    it('maintains an initial textarea value', function(){
      var $el = $(
       '<div>' +
       '  <textarea class="pat-tinymce">' +
       '    foobar' +
       '  </textarea>' +
       '</div>').appendTo('body');
      registry.scan($el);
      expect(tinymce.get(0).getContent()).to.be.equal('<p>foobar</p>');
    });

    it('loads buttons for plugins', function() {
      var $el = $(
       '<div>' +
       '  <textarea class="pat-tinymce">' +
       '  </textarea>' +
       '</div>').appendTo('body');
      registry.scan($el);
      expect(tinymce.get(0).buttons).to.contain.keys('plonelink', 'ploneimage');
    });

    it('on form submit, save data to form', function(){
      var $container = $(
       '<form>' +
       '  <textarea class="pat-tinymce">' +
       '  </textarea>' +
       '</form>').appendTo('body');

      var $el = $container.find('textarea');
      var tinymce = new TinyMCE($el);
      tinymce.tiny.setContent('<p>foobar</p>');
      $container.submit(function(e){
        e.preventDefault();
      });
      $container.trigger('submit');

      expect($el.val()).to.equal('<p>foobar</p>');
    });

    it('auto adds image on upload', function(){
      var tinymce = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID'
      });

      tinymce.fileUploaded({
        filename: 'foobar.png',
        UID: 'foobar'
      });
      expect(tinymce.tiny.getContent()).to.contain('resolveuid/foobar');

    });
    it('auto adds link on file upload', function(){
      var $el = $(
       '<textarea class="pat-tinymce">' +
       '</textarea>').appendTo('body');

      var tinymce = new TinyMCE($el);

      tinymce.fileUploaded({
        filename: 'foobar.txt',
        UID: 'foobar'
      });
      expect(tinymce.tiny.getContent()).to.contain('foobar.txt</a>');

    });

    it('test create correct url from metadata', function(){
      var tiny = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID'
      });
      var data = {
        UID: 'foobar'
      };
      expect(tiny.generateUrl(data)).to.equal('resolveuid/foobar');
    });
    it('test creates correct url from metadata with append', function(){
      var tiny = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID',
        appendToUrl: '.html'
      });
      var data = {
        UID: 'foobar'
      };
      expect(tiny.generateUrl(data)).to.equal('resolveuid/foobar.html');
    });
    it('test parses correct attribute from url', function(){
      var tiny = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID'
      });
      expect(tiny.stripGeneratedUrl('resolveuid/foobar')).to.equal('foobar');
    });

    it('test parses correct attribute from url with appended value', function(){
      var tiny = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID',
        appendToUrl: '/@@view'
      });
      expect(tiny.stripGeneratedUrl('resolveuid/foobar/@@view')).to.equal('foobar');
    });

    it('test get scale from url', function(){
      var pattern = createTinymce({
        prependToScalePart: '/somescale/'
      });
      expect(pattern.getScaleFromUrl('foobar/somescale/foobar')).to.equal('foobar');
    });

    it('test get scale return null if invalid', function(){
      var pattern = createTinymce({
        prependToScalePart: '/somescale/'
      });
      expect(pattern.getScaleFromUrl('foobar')).to.equal(null);
    });

    it('get scale handles edge case of image_ for plone', function(){
      var pattern = createTinymce({
        prependToScalePart: '/somescale'
      });
      expect(pattern.getScaleFromUrl('foobar/somescale/image_large')).to.equal('large');
    });

    it('get scale with appended option', function(){
      var pattern = createTinymce({
        prependToScalePart: '/somescale/',
        appendToScalePart: '/@@view'
      });
      expect(pattern.getScaleFromUrl('foobar/somescale/large/@@view')).to.equal('large');
    });

    it('get scale handles edge case of image_ for plone', function(){
      var pattern = createTinymce({
        prependToScalePart: '/somescale'
      });
      expect(pattern.getScaleFromUrl('foobar/somescale/image_large')).to.equal('large');
    });


    it('test add link', function(){
      var pattern = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID',
        relatedItems: {
          ajaxvocabulary: '/data.json'
        }
      });

      pattern.addLinkClicked();
      pattern.linkModal.linkTypes.internal.$input.select2('data', {
        UID: 'foobar',
        Type: 'Page',
        Title: 'Foobar',
        path: '/foobar'
      });
      expect(pattern.linkModal.getLinkUrl()).to.equal('resolveuid/foobar');
    });
    it('test add external link', function(){
      var pattern = createTinymce();
      pattern.addLinkClicked();
      var modal = pattern.linkModal;
      modal.linkType = 'external';
      modal.linkTypes.external.$input.attr('value', 'http://foobar');
      expect(pattern.linkModal.getLinkUrl()).to.equal('http://foobar');
    });
    it('test add email link', function(){
      var pattern = createTinymce();
      pattern.addLinkClicked();
      pattern.linkModal.linkType = 'email';
      pattern.linkModal.linkTypes.email.$input.attr('value', 'foo@bar.com');
      expect(pattern.linkModal.getLinkUrl()).to.equal('mailto:foo@bar.com');
    });
    it('test add image link', function(){
      var pattern = createTinymce({
        prependToUrl: 'resolveuid/',
        linkAttribute: 'UID',
        prependToScalePart: '/@@images/image/'
      });
      pattern.addImageClicked();
      pattern.imageModal.linkTypes.image.$input.select2('data', {
        UID: 'foobar',
        Type: 'Page',
        Title: 'Foobar',
        path: '/foobar'
      });

      pattern.imageModal.linkType = 'image';
      pattern.imageModal.$scale.find('[value="thumb"]')[0].selected = true;
      expect(pattern.imageModal.getLinkUrl()).to.equal(
        'resolveuid/foobar/@@images/image/thumb');
    });

    it('test adds data attributes', function(){
      var pattern = createTinymce();

      pattern.addLinkClicked();
      pattern.linkModal.linkTypes.internal.$input.select2('data', {
        UID: 'foobar',
        Type: 'Page',
        Title: 'Foobar',
        path: '/foobar'
      });
      pattern.tiny.setContent('<p>blah</p>');
      pattern.linkModal.focusElement(pattern.tiny.dom.getRoot().getElementsByTagName('p')[0]);
      pattern.linkModal.$button.trigger('click');
      expect(pattern.tiny.getContent()).to.contain('data-val="foobar"');
      expect(pattern.tiny.getContent()).to.contain('data-linktype="internal"');
    });

    it('test loading link also sets up related items correctly', function(){
      var pattern = createTinymce({
        relatedItems: {
          ajaxVocabulary: '/data.json'
        }
      });

      pattern.addLinkClicked();

      pattern.linkModal.linkTypes.internal.set('123sdfasdf');
      var val = pattern.linkModal.linkTypes.internal.$input.select2('data');
      /* XXX ajax not loading quickly enough here... 
      expect(val.UID).to.equal('123sdfasdf');
      */
    });

    it('test create upload file modal', function(){
      var pattern = createTinymce();
      pattern.uploadFileClicked();
      expect(pattern.uploadModal.modal.$modal.is(':visible')).to.equal(true);
    });

    it('test reopen upload file modal', function(){
      var pattern = createTinymce();
      pattern.uploadFileClicked();
      pattern.uploadModal.hide();
      expect(pattern.uploadModal.modal.$modal.is(':visible')).to.equal(false);
      pattern.uploadFileClicked();
      expect(pattern.uploadModal.modal.$modal.is(':visible')).to.equal(true);
    });

    it('test reopen add link modal', function(){
      var pattern = createTinymce();
      pattern.addLinkClicked();
      pattern.linkModal.hide();
      expect(pattern.linkModal.modal.$modal.is(':visible')).to.equal(false);
      pattern.addLinkClicked();
      expect(pattern.linkModal.modal.$modal.is(':visible')).to.equal(true);
    });

    it('test reopen add image modal', function(){
      var pattern = createTinymce();
      pattern.addImageClicked();
      pattern.imageModal.hide();
      expect(pattern.imageModal.modal.$modal.is(':visible')).to.equal(false);
      pattern.addImageClicked();
      expect(pattern.imageModal.modal.$modal.is(':visible')).to.equal(true);
    });

    it('test loads existing link external values', function(){
      var pattern = createTinymce();

      pattern.tiny.setContent(
        '<a href="foobar" data-linktype="external" data-val="foobar">foobar</a>');

      pattern.tiny.selection.select(
        pattern.tiny.dom.getRoot().getElementsByTagName('a')[0]);
      pattern.addLinkClicked();

      expect(pattern.linkModal.linkTypes.external.$input.val()).to.equal('foobar');
    });

    it('test loads existing link email values', function(){
      var pattern = createTinymce();

      pattern.tiny.setContent(
        '<a href="mailto:foo@bar.com" data-linktype="email" data-val="foo@bar.com">foobar</a>');

      pattern.tiny.selection.select(
        pattern.tiny.dom.getRoot().getElementsByTagName('a')[0]);
      pattern.addLinkClicked();

      expect(pattern.linkModal.linkTypes.email.$input.val()).to.equal('foo@bar.com');
    });

    it('test anchor link adds existing anchors to list', function(){
      var pattern = createTinymce();

      pattern.tiny.setContent(
        '<a class="mceItemAnchor" name="foobar"></a>');

      pattern.addLinkClicked();

      expect(pattern.linkModal.linkTypes.anchor.anchorNodes.length).to.equal(1);
    });

    it('test anchor link adds anchors from option', function(){
      var pattern = createTinymce({
        anchorSelector: 'h1'
      });

      pattern.tiny.setContent('<h1>blah</h1>');
      pattern.addLinkClicked();
      expect(pattern.linkModal.linkTypes.anchor.anchorNodes.length).to.equal(1);
    });

    it('test anchor get index', function(){
      var pattern = createTinymce({
        anchorSelector: 'h1'
      });

      pattern.tiny.setContent('<h1>blah</h1><h1>foobar</h1>');
      pattern.addLinkClicked();
      expect(pattern.linkModal.linkTypes.anchor.getIndex('foobar')).to.equal(1);
    });

    it('test anchor get url', function(){
      var pattern = createTinymce({
        anchorSelector: 'h1'
      });

      pattern.tiny.setContent('<h1>blah</h1>');
      pattern.addLinkClicked();
      pattern.linkModal.linkTypes.anchor.$select.select2('data', '0');
      expect(pattern.linkModal.linkTypes.anchor.toUrl()).to.equal('#blah');
    });



  });

});

