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

export function addNextPageEventListner(form, products){
    form[0].addEventListener('submit', async e => {
        e.preventDefault();
        //when user clicks on next, the last product (example 8th product) will start from there
        const nextProductName = products[products.length - 1].name;
        //next list of products will start at the last index and grabs the next set of products
        products = await FirebaseController.nextPage(nextProductName);
        home_page(products);
    });
}

export function addPreviousPageEventListener(form, products){
    form[0].addEventListener('submit', async e => {
        e.preventDefault();
        //grabs the previous name of the product
        const prevProductName = products[0].name;
        //passes the name to fetch the previous list of products
        products = await FirebaseController.previousPage(prevProductName);
        home_page(products);
    });
}

//global variable
export let cart;


/**********Home_page function for pagination**********/
export async function home_page(products = []){
    let html = '<h1>Enjoy Shopping</h1>'
    try{
        if(products.length ==0){
            //if there is not products initially, get first 8 products from firbase function
            products = await FirebaseController.getProductListPagination();
        }
       if (cart) {
            cart.items.forEach(item => {
                const product = products.find(p => item.docId == p.docId);
                if (product) product.qty = item.qty;
            });
        }
    }catch(e){
        if(Constant.DEV) console.log(e);
        Util.info('Cannot get product info', JSON.stringify(e));
    }
       //each product is rendered
    for(let i = 0; i<products.length; i++){
        html+= buildProductView(products[i], i)
    }


      
    // renders next and previous buttons
    html+=`
    <hr>
    <div class="container pt-3 bg-light">
        <form method="post" class="form-prev-page">
            <button style="margin: 5px" class="btn btn-secondary float-start">Previous</button>
        </form>
        <form method="post" class="form-next-page">
            <button style="margin: 5px" class="btn btn-secondary float-start">Next</button>
        </form>
    </div>
    `

    Element.root.innerHTML = html; // products will be rendered at this point

    //event listener for next button
    const nextPageForms = document.getElementsByClassName('form-next-page');
    addNextPageEventListner(nextPageForms, products)

    //event listener for previous button
    const prevPageForms = document.getElementsByClassName('form-prev-page');
    addPreviousPageEventListener(prevPageForms, products)


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

// renders each product 
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

    Element.root.innerHTML = html; // products will be rendered at this point

       
   
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
