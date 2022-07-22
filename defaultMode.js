module.exports = [
            {
               title : "Bash",
               name: 'sh',
               snippet: `#!/bin/bash
                     # GNU bash, version 4.3.46
                     @code-here`
            },
            {
               title: 'ActionScript',
               name: 'actionscript'
            },
            {
               title: 'C++',
               name: 'c_cpp',
               snippet: `//Microsoft (R) C/C++ Optimizing Compiler Version 19.00.23506 for x64

                        #include <iostream>

                        int main()
                        {
                           @code-here
                        }`
            },
            {
               title: 'C#',
               name: 'csharp',
               snippet: `//Rextester.Program.Main is the entry point for your code. Don't change it.
                     //Compiler version 4.0.30319.17929 for Microsoft (R) .NET Framework 4.5

                     using System;
                     using System.Collections.Generic;
                     using System.Linq;
                     using System.Text.RegularExpressions;

                     namespace Rextester
                     {
                        public class Program
                        {
                           public static void Main(string[] args)
                           {
                                 // code goes here
                                 @code-here
                           }
                        }
                     }`
            },
            {
               name: 'php',
               snippet: `<html>
                     <head>
                     <title>PHP Test</title>
                     </head>
                     <body>
                     <?php //code goes here
                        @code-here
                     ?> 
                     </body>
                     </html>`
            },
            {
               name: 'html',
               snippet: `<!DOCTYPE html>
            <html>
            <head>
            <title>
            <!-- Title Here -->
            </title>
            </head>
            <body>
            <!-- Code-here -->
            @code-here
            </body>
            </html>`
            },
            {
               name: 'javascript',
               snippet: `document.addEventListener("DOMContentLoaded" , function(){
               @code-here
            });`
            }
         ];