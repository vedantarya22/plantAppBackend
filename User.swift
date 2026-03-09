//
//  User.swift
//  garden_app
//
//  Created by SDC-USER on 24/11/25.
//

import Foundation

class User: Codable {
    let id: String
    var name: String            // "Vedant Arya"
    var username: String
    var profileImageString: String
    var email: String?
    var phoneNumber: String?
    var dateOfBirth: String?
    
    // Stats for Profile Page
    let plantCount: Int
    
    
    init(id: String,
         name: String,
         username: String,
         profileImageString: String,
         plantCount: Int,
         email: String? = nil,
         phoneNumber: String? = nil,
         dateOfBirth: String? = nil) {
        self.id = id
        self.name = name
        self.username = username
        self.profileImageString = profileImageString
        self.plantCount = plantCount
        self.email = email
        self.phoneNumber = phoneNumber
        self.dateOfBirth = dateOfBirth
    }
    
    // Helper for Profile Page Label ("@vedantarya.22")
    var handle: String {
        return "@\(username)"
    }
    
    // Helper for Search Page ("12 Plants | 5 Friends")
    var searchSubtitle: String {
        return "\(plantCount) Plants"
    }
    
    func copy() -> User {
        return User(
            id: self.id,
            name: self.name,
            username: self.username,
            profileImageString: self.profileImageString,
            plantCount: self.plantCount,
            email: self.email,
            phoneNumber: self.phoneNumber,
            dateOfBirth: self.dateOfBirth
        )
    }
}
