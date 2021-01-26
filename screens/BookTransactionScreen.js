import React from "react"
import {Text,TouchableOpacity,StyleSheet,View,TextInput,Image,KeyboardAvoidingView, Alert} from "react-native"
import * as Permissions from "expo-permissions"
import {BarCodeScanner} from "expo-barcode-scanner"
import db from "../config"
import firebase from 'firebase'


export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions : null,
            scannned : false,
            scannedBookId : "",
            scannedStudentId : "",
            buttonState : "normal",
            transactionMessage : ""

        }
    }

    handleTransaction=async()=>{
        var transactionMessage = null
        db.collection("books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
            console.log(doc.data());
            var book = doc.data()
            console.log(this.state.scannedBookId);
            if(book.bookAvailability){
                this.initiateBookIssue()
                transactionMessage = "book issued"
                Alert.alert(transactionMessage)
            }else{
                this.initiateBookReturn()
                transactionMessage = "book returned"
                Alert.alert(transactionMessage)
            }
        })
        this.setState({
            transactionMessage:transactionMessage
        })
    }

    initiateBookIssue=async()=>{
        // adding transaction data
        db.collection("transactions").add({
            "studentId" : this.state.scannedStudentId,
             "bookId" : this.state.scannedBookId,
             "date" : firebase.firrestore.Timestamp.now().toDate(),
             "transactionType" : "issue"
        })
        //changing book status
        db.collection("books").doc(this.state.scannedBookId).update({
            "bookAvailability" : false
        })
        //changing no of books issued
        db.collection("students").doc(this.state.scannedStudentId).update({
            "noOfBooksIssued" : firebase.firestore.FieldValue.increment(1)
        })
    }

    initiateBookReturn=async()=>{
        // adding transaction data
        db.collection("transactions").add({
            "studentId" : this.state.scannedStudentId,
             "bookId" : this.state.scannedBookId,
             "date" : firebase.firrestore.Timestamp.now().toDate(),
             "transactionType" : "return"
        })
        //changing book status
        db.collection("books").doc(this.state.scannedBookId).update({
            "bookAvailability" : true
        })
        //changing no of books issued
        db.collection("students").doc(this.state.scannedStudentId).update({
            "noOfBooksIssued" : firebase.firestore.FieldValue.increment(-1)
        })
    }



    getCameraPermissions=async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions : status==="granted",
            buttonState : id,
            scannned:false,

        })
    }

    handleBarcodeScanned=async({type,data})=>{
        const {buttonState} = this.state
        if(buttonState === "BookId"){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:"normal"
            })
        }   

        else if(buttonState === "StudentId"){
            this.setState({
                scanned:true,
                scannedStudentId:data,
                buttonState:"normal"
            })
        }
        
    }

    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions
        const scanned = this.state.scannned
        const buttonState = this.state.buttonState

        if(buttonState==="clicked" && hasCameraPermissions){
            return(
                <BarCodeScanner onBarcodeScanned={scanned?undefined:this.handleBarcodeScanned}
                />
            )
        }
        else if(buttonState=="normal"){
            return(
                <KeyboardAvoidingView style={styles.container} behavior = "padding" enabled>
                    <View>
                        <Image source={require("../assets/booklogo.jpg")} style={{width:200,height:200}}/>
                        <Text style={{fontSize:20,textAlign:"center"}}>Willy</Text>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput placeholder="book id" style={styles.inputBox} onChangeText={text=>this.setState({scannedBookId:text})} value={this.state.scannedBookId}></TextInput>
                        <TouchableOpacity onPress={()=>{this.getCameraPermissions("BookId")}} style={styles.scannedButton}>
                            <Text>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput placeholder="student id" style={styles.inputBox} onChangeText={text=>this.setState({scannedStudentId:text})} value={this.state.scannedStudentId}></TextInput>
                        <TouchableOpacity onPress={()=>{this.getCameraPermissions("StudentId")}} style={styles.scannedButton}>
                            <Text>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={async()=>{var transactionMessage = await this.handleTransaction()}} style={styles.scannedButton}>
                    <   Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )
            
        }
        
    }
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
    },
    displayText:{
        fontSize:15,
    },
    scannedButton:{
        backgroundColor:"blue",
        margin:10,
        padding:10,      
    },
    buttonText:{
        justifyContent:"center",
        textAlign:"center",
        fontSize:25
    },
    inputBox:{
        width:150,
        height:50,
        borderWidth:2,
        fontSize:20
    },
    inputView:{
        flexDirection:"row",
        margin:15
    }
})