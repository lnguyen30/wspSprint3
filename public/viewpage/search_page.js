import * as Element from './element.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'
import * as Constant from '../model/constant.js'
import * as Home from './home_page.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Route from '../controller/route.js'





export function addEventListeners(){
    Element.formSearch.addEventListener('submit', async e=>{
        e.preventDefault();
        const searchProduct = e.target.searchProducts.value.trim()
        if(searchProduct.length == 0){
            Util.info('Error', 'No Products entered')
            return;
        }
        // keys are stored in firebase as lowercase
        // S -> any non whitespace char, + -> repeat for every keys, g->match for every key
        //search keys into one string, navigate through url
        const searchProductArray = searchProduct.toLowerCase().match(/\S+/g)
        const joinedProductSearch = searchProductArray.join('+')
        //adds search keys to url
        history.pushState(null, null, Route.routePathname.SEARCH + '#' + joinedProductSearch)
        await search_page(joinedProductSearch)
    })
}

export async function search_page(joinedProductSearch){
    if(!joinedProductSearch){
        Util.info('Error', 'No products entered')
        return;
    }
        
    //converts back to arrays of products to be searched
    const searchProductArray = joinedProductSearch.split('+')
    if(searchProductArray.length == 0){
        Util.info('Error', 'No products entered')
        return
    }

     //if user is not authorized 
     if(!Auth.currentUser){
        Element.root.innerHTML='<h1>Protected Page</h1>'
    }

    let productList
    try{
        //calls firebase to retrieve threads with search keys
        productList = await FirebaseController.searchProducts(searchProductArray);
    }catch(e){
        if(Constant.DEV) console.log(e)
        Util.info('Search Error', JSON.stringify(e));
        return;
    }

    Home.buildProductSearchView(productList)
}