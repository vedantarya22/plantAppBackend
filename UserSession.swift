
import Foundation
import UIKit

class UserSession {
    static let shared = UserSession()
    
    var currentLoggedInUserID: String = "u2"
    private var users: [User] = []
    
    var currentUser: User? {
        return users.first(where: { $0.id == currentLoggedInUserID })
    }
    
    private init() {
        seedDummyData()
    }
    
    // MARK: - Public API
    
    func fetchAllUsers(completion: @escaping ([User]) -> Void) {
        completion(self.users)
    }
    
    func fetchCurrentUser(completion: @escaping (User?) -> Void) {
        completion(currentUser)
    }
    
    func isCurrentUser(userID: String) -> Bool {
        return currentLoggedInUserID == userID
    }
    
    func profileImageString(for userID: String) -> String {
        if let user = users.first(where: { $0.id == userID }) {
            return user.profileImageString
        }
        return "person.circle"
    }
    
    func user(withId id: String) -> User? {
        return users.first(where: { $0.id == id })
    }
    
    func updateUser(_ updatedUser: User) {
        if let index = users.firstIndex(where: { $0.id == updatedUser.id }) {
            users[index] = updatedUser
        }
    }
    
    // MARK: - Seed Data
    private func seedDummyData() {
        let vedant = User(
            id: "u1",
            name: "Vedant Arya",
            username: "vedantarya.22",
            profileImageString: "",
            plantCount: 12
        )
        
        let shubham = User(
            id: "u2",
            name: "Shubham",
            username: "shubham_r24",
            profileImageString: "",
            plantCount: 32
        )
        
        let arya = User(
            id: "u3",
            name: "Arya Kulkarni",
            username: "arya.grows",
            profileImageString: "",
            plantCount: 7
        )
        
        let rohan = User(
            id: "u4",
            name: "Rohan Mehta",
            username: "rohan.plants",
            profileImageString: "",
            plantCount: 18
        )
        
        let neha = User(
            id: "u5",
            name: "Neha Sharma",
            username: "neha.greens",
            profileImageString: "",
            plantCount: 25
        )
        
        let kabir = User(
            id: "u6",
            name: "Kabir Verma",
            username: "kabir.gardens",
            profileImageString: "",
            plantCount: 9
        )
        
        self.users = [
            vedant,
            shubham,
            arya,
            rohan,
            neha,
            kabir
        ]
    }
}
