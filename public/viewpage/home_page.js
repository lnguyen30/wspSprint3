import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'
import { ShoppingCart } from '../model/ShoppingCart.js'
import * as DetailsPage from './details_page.js'


//event listeners for home page
export function addEventListeners(){
    Element.menuHome.addEventListener('click', async ()=>{
        history.pushState(null, null, Route.routePathname.HOME);
        const label = Util.disableButton(Element.menuHome);
        await home_page();
        Util.enableButton(Element.menuHome, label)
    })
}

//global variable
export let cart;



/**********Home_page function for pagination**********/
export async function home_page(products = []){
    let html = '<h1>Enjoy Shopping</h1>'
    try{
        if(products.length ==0){
            products = await FirebaseController.getProductListPagination();
        }
        if(cart){
            cart.items.forEach(item =>{
                //parses through each item and finds the specific product
                const product = products.find(p=> item.docId == p.docId)
                //updates label
                product.qty = item.qty;
            })
        }
    }catch(e){
        if(Constant.DEV) console.log(e);
        Util.info('Cannot get product info', JSON.stringify(e));
    }
       //each product is rendered
    for(let i = 0; i<products.length; i++){
        html+= buildProductView(products[i], i)
    }

    html+=`
    <hr>
    <div class="container pt-3 bg-light">
        <form method="post" class="form-prev-page">
            <button class="btn btn-primary float-start">Previous</button>
        </form>
        <form method="post" class="form-next-page">
            <button class="btn btn-primary float-start">Next</button>
        </form>
    </div>
    `

    Element.root.innerHTML = html; // products will be rendered at this point

    //event listener for next button
    const nextPageForms = document.getElementsByClassName('form-next-page');
    nextPageForms[0].addEventListener('submit', async e => {
        e.preventDefault();
        const productsFinalIndex = products.length - 1;
        const finalProductName = products[productsFinalIndex].name;

        products = await FirebaseController.getNextPage(finalProductName);
        home_page(products);
    });

    //event listener for previous button
    const prevPageForms = document.getElementsByClassName('form-prev-page');
    prevPageForms[0].addEventListener('submit', async e => {
        e.preventDefault();

        const firstProductName = products[0].name;

        products = await FirebaseController.getPreviousPage(firstProductName);
        home_page(products);
    });

}

function buildProductView(product, index){
    return `
    <div class="card" style="width: 18rem; display: inline-block">
     <img src="${product.imageURL}" class="card-img-top">
        <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">
                ${Util.currency(product.price)}<br>
                ${product.summary}
            </p>
            <div>
                <form method="post" class="product-details-form">
                    <input type="hidden" name="productId" value="${product.docId}">
                    <button type="submit" class="btn btn-outline-primary">Details</button> 
                </form>
            </div>
            <div class="container pt-3 bg-light ${Auth.currentUser ? 'd-block' : 'd-none'}">
                <form method="post" class="d-inline form-dec-qty">
                    <input type="hidden" name="index" value="${index}">
                    <button class="btn btn-outline-danger" type="submit">&minus;</button>
                </form>
                <div id="qty-${product.docId}" class="container rounded text-center text-white bg-primary d-inline-block w-50">
                    ${product.qty == null || product.qty == 0 ? 'Add' : product.qty}
                </div>
                <form method="post" class="d-inline form-inc-qty">
                    <input type="hidden" name="index" value="${index}">
                    <button class="btn btn-outline-primary" type="submit">&plus;</button>
                </form>
            </div>
        </div>
    </div>
    `;

 }
// re-renders the home page after search 
 export function buildProductSearchView(productList){
     let html = ''

        //checks if any products are added, if not, display message
    if(productList.length == 0){
        html += '<h4>No Products Currently</h4>'
        Element.root.innerHTML = html;
        return;
    }
       //each product is rendered
    for(let i = 0; i<productList.length; i++){
        html+= buildProductView(productList[i], i)
    }

    
    Element.root.innerHTML = html; // products will be rendered at this point

       //event listener for decreasing items
       const decForms = document.getElementsByClassName('form-dec-qty');
       for(let i =0; i< decForms.length; i++){
           decForms[i].addEventListener('submit', e=>{
               e.preventDefault();
               //index of the products array from form
               const p = products[e.target.index.value]
               //dec p from cart
               cart.removeItem(p);
               //updates label amount
               document.getElementById('qty-' + p.docId).innerHTML = (p.qty == 0 || p.qty == null) ? 'Add' : p.qty;
               //upates shopping cart count
               Element.shoppingCartCount.innerHTML = cart.getTotalQty();
           })
       }
   
       //event listener for increasing items
       const incForms = document.getElementsByClassName('form-inc-qty');
       for(let i =0; i< incForms.length; i++){
           incForms[i].addEventListener('submit', e=>{
               e.preventDefault();
               //index of the products array from form
               const p = products[e.target.index.value]
               //inc p to cart
               cart.addItem(p);
               // updates label amount
               document.getElementById('qty-' + p.docId).innerHTML = p.qty;
               Element.shoppingCartCount.innerHTML = cart.getTotalQty();
   
           })
       }
   
       DetailsPage.addDetailsButtonListeners(); //event listener for details button
 }


//user calls cart object when signed in
export function initShoppingCart(){

    //creates or recreates cart after browser refreshes or user signs out/in
    const cartString = window.localStorage.getItem('cart-' + Auth.currentUser.uid);
    //cart will be new 
    cart = ShoppingCart.parse(cartString);
    if(!cart || !cart.isValid() || cart.uid != Auth.currentUser.uid){
        //if invalid, then remove item
        window.localStorage.removeItem('cart-' + Auth.currentUser.uid);
        //create new shopping cart
        cart = new ShoppingCart(Auth.currentUser.uid);
    }

    //cart = new ShoppingCart(Auth.currentUser.uid);

    //update cart count

    Element.shoppingCartCount.innerHTML = cart.getTotalQty();
}
