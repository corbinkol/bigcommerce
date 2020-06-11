import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import utils from '@bigcommerce/stencil-utils';

export default class Category extends CatalogPage {
    onReady() {
        let isAlert = this.isAlert()
        
        if(isAlert != ''){
            this.displayAlert(isAlert);
        }

        this.cartHasItems();
        this.thumbHover();
        this.addAllToCart();
    }

    thumbHover() {
        let imgInfo = {};
        $('.card-img-container img').hover(function() {
            const el = $(this);
            const thumbSrc = el.attr('src');
            const thumbSrcset = el.attr('data-srcset');
            imgInfo = {'src': thumbSrc, 'srcset': thumbSrcset, 'data-srcset': thumbSrcset}
            const regex = /products\/([0-9]+)\//;
            const productId = thumbSrc.match(regex);

            utils.api.product.getById(productId[1], { template: 'custom/img-hover'}, (err, resp) => {
                let src = $(resp).attr('src');
                let srcset = $(resp).attr('data-srcset');
                el.attr({'src': src, 'srcset': srcset, 'data-srcset': srcset});
            });    
        }, function(){
            $(this).attr(imgInfo);
        }); 
    }

    cartHasItems() {
 
        getCart('/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options')
            .then(data => {
                if (data.length !== 0) {
                    const cartId = data[0].id;
                    const cartItems = data[0].lineItems.physicalItems;
                    let numItems = cartItems.length;
                    if (numItems >= 1){
                        const el = $('#delAllInCart');
                        el.show();
                        el.click(function(){
                            deleteCart('/api/storefront/carts/', cartId);
                        });
    
                    }
                }
            });

        function getCart(url) {
            return fetch(url, {
                method: "GET",
                credentials: "same-origin"
            })
            .then(response => response.json());
         };

        function deleteCart(url, cartId) {
            return fetch(url + cartId, {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",}
            })
            .then(response => window.location.href = window.location.href + "?del");
         };
    }

    addAllToCart() {
        let allProductIds = [];
        $('*[data-product-id]').each(function(){
            allProductIds.push($(this).attr('data-product-id'));
        });
        const el = $('#addAllToCart');
        el.click(function(){
            let lineItemsToAdd = {};
            lineItemsToAdd.lineItems = [];
            $.each(allProductIds, function(index, value) {
                lineItemsToAdd.lineItems.push({
                    'quantity': 1,
                    'productId': value
                });
            });

            getCart('/api/storefront/carts')
                .then(data => {
                    if (data.length === 0) {
                        createCart('/api/storefront/carts', lineItemsToAdd);
                    }
                    else {
                        let cartId = data[0].id;
                        addCartItem(`/api/storefront/carts/`, cartId, lineItemsToAdd);
                    }
                });
        });

        function getCart(url) {
            return fetch(url, {
                method: "GET",
                credentials: "same-origin"
            })
            .then(response => response.json());
         };

        function createCart(url, cartItems) {
            return fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"},
                body: JSON.stringify(cartItems),
            })
            .then(response => window.location.href = window.location.href + "?add");
          };

          function addCartItem(url, cartId, cartItems) {
            return fetch(url + cartId + '/items', {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"},
                body: JSON.stringify(cartItems),
            })
            .then(response => window.location.href = window.location.href + "?add");
       };
    }

    isAlert() {
        let query = window.location.search.substring(1);
        let params = query.split('&');
        window.history.replaceState({}, '', window.location.href.split('?')[0]);
        return params[0];
    }

    displayAlert(alert) {
        const el = $('#alert');
        const message = el.find('.alertBox-message');
        if (alert === 'add'){
            message.html('Item(s) have been added to cart.');
            el.show();
        }
        if (alert === 'del'){
            message.html('Item(s) have been deleted from cart.');
            el.show();
        }
    }

    

}
